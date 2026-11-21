import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Services } from "../../container.js";
import { actorOf } from "../actor.js";
import { stockMovementBody, updateProductBody, updateVariantBody } from "../schemas.js";

export function inventoryRoutes(app: FastifyInstance, { inventory }: Services) {
  app.get("/api/catalog", async () => inventory.catalog());

  app.patch("/api/products/:id", async (req) => {
    const { id } = z.object({ id: z.string().max(64) }).parse(req.params);
    return inventory.updateProduct(id, updateProductBody.parse(req.body));
  });

  app.patch("/api/variants/:sku", async (req) => {
    const { sku } = z.object({ sku: z.string().max(40) }).parse(req.params);
    return inventory.updateVariant(sku, updateVariantBody.parse(req.body));
  });

  app.post("/api/variants/:sku/movements", async (req, reply) => {
    const { sku } = z.object({ sku: z.string().max(40) }).parse(req.params);
    const body = stockMovementBody.parse(req.body);
    return reply.status(201).send(await inventory.moveStock({ sku, ...body, actor: actorOf(req) }));
  });

  app.get("/api/movements", async (req) => {
    const q = z
      .object({ sku: z.string().max(40).optional(), limit: z.coerce.number().int().min(1).max(500).default(100) })
      .parse(req.query);
    return inventory.movements(q.sku, q.limit);
  });
}
