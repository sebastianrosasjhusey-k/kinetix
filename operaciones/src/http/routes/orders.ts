import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { formatPEN } from "../../domain/money.js";
import type { Services } from "../../container.js";
import { actorOf } from "../actor.js";
import { changeStatusBody, createOrderBody, idempotencyKeyHeader, listOrdersQuery, updateOrderBody } from "../schemas.js";

const idParams = z.object({ id: z.string().min(1).max(64) });

export function orderRoutes(app: FastifyInstance, { orders }: Services) {
  app.get("/api/orders", async (req) => {
    const { limit, offset, ...filter } = listOrdersQuery.parse(req.query);
    return orders.list(filter, { limit, offset });
  });

  app.get("/api/orders/export.csv", async (req, reply) => {
    const { limit: _l, offset: _o, ...filter } = listOrdersQuery.parse(req.query);
    const { items } = await orders.list(filter, { limit: 100_000, offset: 0 });
    const header = ["codigo", "fecha", "estado", "cliente", "telefono", "distrito", "pago", "canal", "productos", "total"];
    const rows = items.map((o) => [
      o.code,
      o.createdAt,
      o.status,
      o.customerName,
      o.phone,
      o.district,
      o.paymentMethod,
      o.channel,
      o.lines.map((l) => `${l.quantity}x ${l.productName} ${l.flavor}`).join(" | "),
      formatPEN(o.totalCents),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    return reply
      .header("content-type", "text/csv; charset=utf-8")
      .header("content-disposition", `attachment; filename="pedidos-kinetix.csv"`)
      .send("﻿" + csv); // BOM para que Excel respete tildes
  });

  app.get("/api/orders/:id", async (req) => orders.get(idParams.parse(req.params).id));

  app.post("/api/orders", async (req, reply) => {
    const body = createOrderBody.parse(req.body);
    const idempotencyKey = idempotencyKeyHeader.parse(req.headers["idempotency-key"]) ?? null;
    const { order, created } = await orders.create({ ...body, idempotencyKey }, actorOf(req));
    return reply.status(created ? 201 : 200).header("location", `/api/orders/${order.id}`).send(order);
  });

  app.post("/api/orders/:id/status", async (req) =>
    orders.changeStatus(idParams.parse(req.params).id, changeStatusBody.parse(req.body), actorOf(req)),
  );

  app.patch("/api/orders/:id", async (req) =>
    orders.updateDetails(idParams.parse(req.params).id, updateOrderBody.parse(req.body), actorOf(req)),
  );
}

/** Escapa celdas CSV y neutraliza inyección de fórmulas en Excel (=, +, -, @). */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
