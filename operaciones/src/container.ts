import { randomUUID } from "node:crypto";
import { MemoryStore } from "./infra/memory/memory-store.js";
import type { Clock, IdGenerator } from "./ports/repositories.js";
import type { ServiceContext } from "./services/context.js";
import { CustomerService } from "./services/customer-service.js";
import { InventoryService } from "./services/inventory-service.js";
import { OrderService } from "./services/order-service.js";
import { ReportService } from "./services/report-service.js";

export interface Services {
  orders: OrderService;
  inventory: InventoryService;
  customers: CustomerService;
  reports: ReportService;
}

/**
 * Raíz de composición: el ÚNICO lugar que decide qué implementación de
 * persistencia se usa. Para pasar a una base de datos en línea se cambia aquí.
 */
export function createContainer(opts: { clock?: Clock; ids?: IdGenerator } = {}) {
  const store = new MemoryStore();
  const ctx: ServiceContext = {
    uow: store,
    repos: store.repos,
    clock: opts.clock ?? { now: () => new Date() },
    ids: opts.ids ?? { next: () => randomUUID() },
  };
  const services: Services = {
    orders: new OrderService(ctx),
    inventory: new InventoryService(ctx),
    customers: new CustomerService(ctx),
    reports: new ReportService(ctx),
  };
  return { services, repos: store.repos };
}
