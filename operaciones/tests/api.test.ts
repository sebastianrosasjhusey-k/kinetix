import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/http/app.js";
import { baseOrder, setup } from "./helpers.js";

let app: FastifyInstance;
afterEach(() => app?.close());

async function make() {
  const { services } = await setup();
  app = await buildApp(services);
  return app;
}

describe("API HTTP", () => {
  it("POST /api/orders crea (201) y repetir con la misma clave devuelve 200", async () => {
    await make();
    const req = { method: "POST" as const, url: "/api/orders", payload: baseOrder, headers: { "idempotency-key": "abc-12345678", "x-operador": "Sebas" } };
    const r1 = await app.inject(req);
    expect(r1.statusCode).toBe(201);
    expect(r1.json().history[0].actor).toBe("Sebas");
    const r2 = await app.inject(req);
    expect(r2.statusCode).toBe(200);
    expect(r2.json().id).toBe(r1.json().id);
  });

  it("valida el cuerpo y responde con formato de error uniforme", async () => {
    await make();
    const r = await app.inject({ method: "POST", url: "/api/orders", payload: { ...baseOrder, items: [] } });
    expect(r.statusCode).toBe(400);
    expect(r.json().error.code).toBe("VALIDACION");
    expect(r.json().error.details.items).toBeDefined();
  });

  it("mapea errores de negocio a 404 / 409 / 422", async () => {
    await make();
    expect((await app.inject({ method: "GET", url: "/api/orders/nope" })).statusCode).toBe(404);
    const stock = await app.inject({ method: "POST", url: "/api/orders", payload: { ...baseOrder, items: [{ sku: "HYD-LIM", quantity: 99 }] } });
    expect(stock.statusCode).toBe(422);
    expect(stock.json().error.code).toBe("STOCK_INSUFICIENTE");
    const created = (await app.inject({ method: "POST", url: "/api/orders", payload: baseOrder })).json();
    const stale = await app.inject({ method: "POST", url: `/api/orders/${created.id}/status`, payload: { to: "confirmado", expectedVersion: 9 } });
    expect(stale.statusCode).toBe(409);
  });

  it("busca pedidos por código o cliente y exporta CSV seguro", async () => {
    await make();
    await app.inject({ method: "POST", url: "/api/orders", payload: { ...baseOrder, customer: { name: "=HYPERLINK(1)", phone: "999888777" } } });
    const list = (await app.inject({ method: "GET", url: "/api/orders?search=kx-1001" })).json();
    expect(list.total).toBe(1);
    const csv = await app.inject({ method: "GET", url: "/api/orders/export.csv" });
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.body).toContain("'=HYPERLINK(1)");
  });

  it("sirve la interfaz y cabeceras de seguridad", async () => {
    await make();
    const r = await app.inject({ method: "GET", url: "/" });
    expect(r.statusCode).toBe(200);
    expect(r.headers["content-security-policy"]).toContain("default-src 'self'");
  });
});
