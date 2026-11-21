import { normalizePhone } from "../domain/customer.js";
import { ConflictError, InsufficientStockError, NotFoundError, ValidationError } from "../domain/errors.js";
import { assertCents, type Cents } from "../domain/money.js";
import {
  allowedTransitions,
  assertTransition,
  type Order,
  type OrderLine,
  type OrderStatus,
  type PaymentMethod,
  type SalesChannel,
} from "../domain/order.js";
import type { OrderFilter, Page } from "../ports/repositories.js";
import type { ServiceContext } from "./context.js";
import { applyStock } from "./inventory-service.js";

export interface CreateOrderInput {
  customer: { name: string; phone: string; email?: string | null };
  address: string;
  district: string;
  reference?: string | null;
  channel: SalesChannel;
  paymentMethod: PaymentMethod;
  items: { sku: string; quantity: number }[];
  discountCents?: Cents;
  shippingCents?: Cents;
  notes?: string | null;
  idempotencyKey?: string | null;
}

export type OrderView = Order & { allowedTransitions: OrderStatus[] };

const view = (o: Order): OrderView => ({ ...o, allowedTransitions: allowedTransitions(o) });

export class OrderService {
  constructor(private readonly ctx: ServiceContext) {}

  async list(filter: OrderFilter, page: { limit: number; offset: number }): Promise<Page<OrderView>> {
    const res = await this.ctx.repos.orders.list(filter, page);
    return { ...res, items: res.items.map(view) };
  }

  async get(idOrCode: string): Promise<OrderView> {
    const o = (await this.ctx.repos.orders.get(idOrCode)) ?? (await this.ctx.repos.orders.getByCode(idOrCode));
    if (!o) throw new NotFoundError(`Pedido ${idOrCode} no existe`);
    return view(o);
  }

  /**
   * Crea el pedido y reserva stock en una sola transacción. El precio se toma
   * del catálogo en el servidor (nunca del cliente) y queda congelado en la línea.
   */
  async create(input: CreateOrderInput, actor: string): Promise<{ order: OrderView; created: boolean }> {
    if (input.items.length === 0) throw new ValidationError("El pedido debe tener al menos un producto");
    const discountCents = assertCents(input.discountCents ?? 0, "descuento");
    const shippingCents = assertCents(input.shippingCents ?? 0, "envío");
    const phone = normalizePhone(input.customer.phone);
    if (phone.length < 7) throw new ValidationError("Teléfono inválido");

    return this.ctx.uow.run(async (r) => {
      if (input.idempotencyKey) {
        const previous = await r.orders.findByIdempotencyKey(input.idempotencyKey);
        if (previous) return { order: view(previous), created: false };
      }

      // Agrupar SKUs repetidos para validar stock sobre el total pedido.
      const qtyBySku = new Map<string, number>();
      for (const it of input.items) {
        if (!Number.isInteger(it.quantity) || it.quantity <= 0) throw new ValidationError(`Cantidad inválida para ${it.sku}`);
        qtyBySku.set(it.sku, (qtyBySku.get(it.sku) ?? 0) + it.quantity);
      }

      const now = this.ctx.clock.now().toISOString();
      const number = await r.orders.nextNumber();
      const code = `KX-${number}`;
      const lines: OrderLine[] = [];
      const shortages: { sku: string; requested: number; available: number }[] = [];

      for (const [sku, quantity] of qtyBySku) {
        const variant = await r.variants.get(sku);
        const product = variant ? await r.products.get(variant.productId) : null;
        if (!variant || !product) throw new NotFoundError(`SKU ${sku} no existe`);
        if (!variant.active || !product.active) throw new ValidationError(`${product.name} ${variant.flavor} no está disponible`);
        if (variant.stock < quantity) {
          shortages.push({ sku, requested: quantity, available: variant.stock });
          continue;
        }
        await applyStock(this.ctx, r, variant, -quantity, "salida_pedido", "Reserva por pedido", code, actor);
        lines.push({
          sku,
          productName: product.name,
          flavor: variant.flavor,
          unitPriceCents: product.priceCents,
          quantity,
          lineTotalCents: product.priceCents * quantity,
        });
      }
      if (shortages.length) {
        // Lanzar revierte toda la transacción, incluidos los descuentos ya hechos.
        throw new InsufficientStockError("No hay stock suficiente para algunos productos", shortages);
      }

      const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
      if (discountCents > subtotalCents) throw new ValidationError("El descuento no puede superar el subtotal");

      const customer = await this.upsertCustomer(r, { ...input.customer, phone }, now);
      const order: Order = {
        id: this.ctx.ids.next(),
        code,
        customerId: customer.id,
        customerName: customer.name,
        phone,
        email: customer.email,
        address: input.address,
        district: input.district,
        reference: input.reference ?? null,
        channel: input.channel,
        paymentMethod: input.paymentMethod,
        status: "nuevo",
        lines,
        subtotalCents,
        discountCents,
        shippingCents,
        totalCents: subtotalCents - discountCents + shippingCents,
        notes: input.notes ?? null,
        history: [{ from: null, to: "nuevo", at: now, actor, note: null }],
        createdAt: now,
        updatedAt: now,
        idempotencyKey: input.idempotencyKey ?? null,
        version: 1,
      };
      await r.orders.save(order);
      return { order: view(order), created: true };
    });
  }

  /** Cambia el estado. Cancelar devuelve el stock reservado. */
  async changeStatus(
    id: string,
    input: { to: OrderStatus; expectedVersion: number; note?: string | null },
    actor: string,
  ): Promise<OrderView> {
    return this.ctx.uow.run(async (r) => {
      const order = await r.orders.get(id);
      if (!order) throw new NotFoundError(`Pedido ${id} no existe`);
      assertVersion(order, input.expectedVersion);
      assertTransition(order, input.to);

      if (input.to === "cancelado") {
        for (const line of order.lines) {
          const variant = await r.variants.get(line.sku);
          if (variant) await applyStock(this.ctx, r, variant, line.quantity, "liberacion_pedido", "Pedido cancelado", order.code, actor);
        }
      }
      const now = this.ctx.clock.now().toISOString();
      order.history.push({ from: order.status, to: input.to, at: now, actor, note: input.note ?? null });
      order.status = input.to;
      order.updatedAt = now;
      order.version += 1;
      await r.orders.save(order);
      return view(order);
    });
  }

  /** Edita datos de entrega/notas. Las líneas no se editan: se cancela y se crea otro pedido. */
  async updateDetails(
    id: string,
    input: { expectedVersion: number; address?: string; district?: string; reference?: string | null; notes?: string | null },
    actor: string,
  ): Promise<OrderView> {
    return this.ctx.uow.run(async (r) => {
      const order = await r.orders.get(id);
      if (!order) throw new NotFoundError(`Pedido ${id} no existe`);
      assertVersion(order, input.expectedVersion);
      if (order.status === "entregado" || order.status === "cancelado")
        throw new ValidationError(`Un pedido ${order.status} ya no se puede editar`);
      const { expectedVersion: _v, ...patch } = input;
      Object.assign(order, Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)));
      order.updatedAt = this.ctx.clock.now().toISOString();
      order.version += 1;
      order.history.push({ from: order.status, to: order.status, at: order.updatedAt, actor, note: "Datos de entrega editados" });
      await r.orders.save(order);
      return view(order);
    });
  }

  private async upsertCustomer(
    r: Parameters<Parameters<ServiceContext["uow"]["run"]>[0]>[0],
    data: { name: string; phone: string; email?: string | null },
    now: string,
  ) {
    const existing = await r.customers.findByPhone(data.phone);
    const customer = existing ?? { id: this.ctx.ids.next(), phone: data.phone, name: data.name, email: null, createdAt: now };
    customer.name = data.name;
    if (data.email) customer.email = data.email;
    await r.customers.save(customer);
    return customer;
  }
}

function assertVersion(order: Order, expected: number) {
  if (order.version !== expected) {
    throw new ConflictError("El pedido fue modificado por otra persona. Recarga y vuelve a intentar.", {
      currentVersion: order.version,
    });
  }
}
