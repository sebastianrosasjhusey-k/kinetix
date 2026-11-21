import { loadConfig } from "./config.js";
import { createContainer } from "./container.js";
import { buildApp } from "./http/app.js";
import { seedCatalog, seedDemoOrders } from "./seed.js";

const config = loadConfig();
const { services, repos } = createContainer();

await seedCatalog(repos, services);
if (config.SEED_DEMO) await seedDemoOrders(services);

const app = await buildApp(services, {
  logger: {
    level: config.LOG_LEVEL,
    // Nunca registrar datos personales de clientes en los logs.
    redact: ["req.headers.authorization", "req.body.customer"],
  },
});

// Cierre ordenado: termina las solicitudes en curso antes de salir.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    app.log.info({ signal }, "Cerrando servidor");
    await app.close();
    process.exit(0);
  });
}

try {
  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(`Kinetix Operaciones listo en http://${config.HOST === "0.0.0.0" ? "localhost" : config.HOST}:${config.PORT}`);
  app.log.warn("Almacenamiento EN MEMORIA: los datos se pierden al detener el servidor.");
} catch (err) {
  app.log.fatal(err);
  process.exit(1);
}
