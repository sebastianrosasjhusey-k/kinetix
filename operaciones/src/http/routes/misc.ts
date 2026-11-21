import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Services } from "../../container.js";
import { ORDER_STATUSES, PAYMENT_METHODS, SALES_CHANNELS, TRANSITIONS } from "../../domain/order.js";
import { rangeQuery } from "../schemas.js";

export const LIMA_DISTRICTS = [
  "Barranco", "Breña", "Chorrillos", "Jesús María", "La Molina", "La Victoria", "Lince", "Lima Cercado",
  "Los Olivos", "Magdalena del Mar", "Miraflores", "Pueblo Libre", "San Borja", "San Isidro",
  "San Juan de Lurigancho", "San Juan de Miraflores", "San Martín de Porres", "San Miguel", "Santa Anita",
  "Santiago de Surco", "Surquillo", "Callao", "Ate", "Otro (provincia)",
];

export function miscRoutes(app: FastifyInstance, { customers, reports }: Services) {
  app.get("/api/health", async () => ({ status: "ok", storage: "memoria", time: new Date().toISOString() }));

  /** Catálogos para que la UI no tenga listas duplicadas. */
  app.get("/api/meta", async () => ({
    statuses: ORDER_STATUSES,
    paymentMethods: PAYMENT_METHODS,
    channels: SALES_CHANNELS,
    transitions: TRANSITIONS,
    districts: LIMA_DISTRICTS,
  }));

  app.get("/api/customers", async (req) => {
    const { search } = z.object({ search: z.string().max(100).optional() }).parse(req.query);
    return customers.list(search);
  });

  app.get("/api/reports/summary", async (req) => reports.summary(rangeQuery.parse(req.query)));
}
