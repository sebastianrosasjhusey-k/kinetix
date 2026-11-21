import { describe, expect, it } from "vitest";
import { ConflictError, InsufficientStockError, InvalidTransitionError } from "../src/domain/errors.js";
import { baseOrder, setup } from "./helpers.js";

describe("OrderService", () => {
  it("crea el pedido con precio del catálogo y descuenta stock", async () => {
    const { services, repos } = await setup();
    const { order } = await services.orders.create({ ...baseOrder, shippingCents: 1000, discountCents: 500 }, "ana");
    expect(order.code).toBe("KX-1001");
    expect(order.status).toBe("nuevo");
    expect(order.subtotalCents).toBe(19000);
    expect(order.totalCents).toBe(19000 - 500 + 1000);
    expect(order.phone).toBe("987654321");
    expect((await repos.variants.get("CPRIX-NAR"))!.stock).toBe(8);
    const movs = await services.inventory.movements("CPRIX-NAR");
    expect(movs[0]).toMatchObject({ type: "salida_pedido", quantity: -2, stockAfter: 8, orderCode: "KX-1001" });
  });

  it("agrupa SKUs repetidos", async () => {
    const { services } = await setup();
    const { order } = await services.orders.create({ ...baseOrder, items: [{ sku: "RAW-SS", quantity: 1 }, { sku: "RAW-SS", quantity: 2 }] }, "x");
    expect(order.lines).toHaveLength(1);
    expect(order.lines[0]!.quantity).toBe(3);
  });

  it("si falta stock de un producto no descuenta NADA (transacción)", async () => {
    const { services, repos } = await setup();
    await expect(
      services.orders.create({ ...baseOrder, items: [{ sku: "CPRIX-NAR", quantity: 1 }, { sku: "HYD-LIM", quantity: 3 }] }, "x"),
    ).rejects.toBeInstanceOf(InsufficientStockError);
    expect((await repos.variants.get("CPRIX-NAR"))!.stock).toBe(10);
    expect((await repos.orders.all())).toHaveLength(0);
  });

  it("la misma Idempotency-Key no duplica el pedido", async () => {
    const { services, repos } = await setup();
    const a = await services.orders.create({ ...baseOrder, idempotencyKey: "clave-123456" }, "x");
    const b = await services.orders.create({ ...baseOrder, idempotencyKey: "clave-123456" }, "x");
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.order.id).toBe(a.order.id);
    expect((await repos.variants.get("CPRIX-NAR"))!.stock).toBe(8);
  });

  it("reconoce al cliente recurrente por teléfono", async () => {
    const { services } = await setup();
    await services.orders.create(baseOrder, "x");
    await services.orders.create({ ...baseOrder, customer: { name: "Ana P.", phone: "987-654-321" } }, "x");
    const customers = await services.customers.list();
    expect(customers).toHaveLength(1);
    expect(customers[0]).toMatchObject({ name: "Ana P.", orders: 2 });
  });

  it("sigue la máquina de estados y registra historial", async () => {
    const { services } = await setup();
    const { order } = await services.orders.create(baseOrder, "ana");
    expect(order.allowedTransitions).toEqual(["confirmado", "cancelado"]);
    const c = await services.orders.changeStatus(order.id, { to: "confirmado", expectedVersion: 1 }, "luis");
    expect(c.allowedTransitions).toEqual(["pagado", "cancelado"]); // yape: no se envía sin pagar
    await expect(services.orders.changeStatus(order.id, { to: "entregado", expectedVersion: 2 }, "luis")).rejects.toBeInstanceOf(
      InvalidTransitionError,
    );
    expect(c.history.map((h) => [h.to, h.actor])).toEqual([["nuevo", "ana"], ["confirmado", "luis"]]);
  });

  it("contra entrega puede enviarse sin estar pagado", async () => {
    const { services } = await setup();
    const { order } = await services.orders.create({ ...baseOrder, paymentMethod: "efectivo_contra_entrega" }, "x");
    const c = await services.orders.changeStatus(order.id, { to: "confirmado", expectedVersion: 1 }, "x");
    expect(c.allowedTransitions).toContain("enviado");
  });

  it("cancelar devuelve el stock", async () => {
    const { services, repos } = await setup();
    const { order } = await services.orders.create(baseOrder, "x");
    await services.orders.changeStatus(order.id, { to: "cancelado", expectedVersion: 1, note: "Cliente desistió" }, "x");
    expect((await repos.variants.get("CPRIX-NAR"))!.stock).toBe(10);
  });

  it("rechaza cambios con versión desactualizada (edición simultánea)", async () => {
    const { services } = await setup();
    const { order } = await services.orders.create(baseOrder, "x");
    await services.orders.changeStatus(order.id, { to: "confirmado", expectedVersion: 1 }, "a");
    await expect(services.orders.changeStatus(order.id, { to: "cancelado", expectedVersion: 1 }, "b")).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("un cambio de precio no altera pedidos existentes", async () => {
    const { services } = await setup();
    const { order } = await services.orders.create(baseOrder, "x");
    await services.inventory.updateProduct("c-prix", { priceCents: 12000 });
    expect((await services.orders.get(order.id)).totalCents).toBe(19000);
  });

  it("pedidos concurrentes no venden más stock del que hay", async () => {
    const { services, repos } = await setup();
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => services.orders.create({ ...baseOrder, items: [{ sku: "HYD-LIM", quantity: 1 }] }, "x")),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
    expect((await repos.variants.get("HYD-LIM"))!.stock).toBe(0);
  });
});

describe("ReportService", () => {
  it("cuenta como venta solo pedidos pagados/enviados/entregados", async () => {
    const { services } = await setup();
    const a = await services.orders.create(baseOrder, "x");
    await services.orders.create({ ...baseOrder, items: [{ sku: "RAW-SS", quantity: 1 }] }, "x");
    await services.orders.changeStatus(a.order.id, { to: "confirmado", expectedVersion: 1 }, "x");
    await services.orders.changeStatus(a.order.id, { to: "pagado", expectedVersion: 2 }, "x");
    const s = await services.reports.summary();
    expect(s.revenueCents).toBe(19000);
    expect(s.pendingCollectionCents).toBe(3000);
    expect(s.ordersByStatus).toMatchObject({ nuevo: 1, pagado: 1 });
    expect(s.lowStock.map((l) => l.sku)).toContain("HYD-LIM");
  });
});
