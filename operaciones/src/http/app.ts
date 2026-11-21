import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyServerOptions } from "fastify";
import { fileURLToPath } from "node:url";
import type { Services } from "../container.js";
import { errorHandler } from "./error-handler.js";
import { inventoryRoutes } from "./routes/inventory.js";
import { miscRoutes } from "./routes/misc.js";
import { orderRoutes } from "./routes/orders.js";

const PUBLIC_DIR = fileURLToPath(new URL("../../public/", import.meta.url));

/** Construye la app sin escuchar en un puerto: así las pruebas la usan con inject(). */
export async function buildApp(services: Services, opts: FastifyServerOptions = {}) {
  const app = Fastify({ bodyLimit: 256 * 1024, ...opts });

  app.setErrorHandler(errorHandler);

  // Cabeceras de seguridad básicas (equivalente mínimo a helmet).
  app.addHook("onSend", async (_req, reply) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "no-referrer");
    reply.header(
      "content-security-policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
    );
  });

  orderRoutes(app, services);
  inventoryRoutes(app, services);
  miscRoutes(app, services);

  await app.register(fastifyStatic, { root: PUBLIC_DIR });
  app.setNotFoundHandler((req, reply) =>
    req.url.startsWith("/api/")
      ? reply.status(404).send({ error: { code: "NO_ENCONTRADO", message: "Ruta no encontrada" } })
      : reply.sendFile("index.html"),
  );

  return app;
}
