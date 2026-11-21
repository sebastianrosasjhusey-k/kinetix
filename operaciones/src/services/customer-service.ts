import type { Customer } from "../domain/customer.js";
import { isRevenue } from "../domain/order.js";
import type { ServiceContext } from "./context.js";

export interface CustomerSummary extends Customer {
  orders: number;
  spentCents: number;
  lastOrderAt: string | null;
}

export class CustomerService {
  constructor(private readonly ctx: ServiceContext) {}

  async list(search?: string): Promise<CustomerSummary[]> {
    const [customers, orders] = await Promise.all([this.ctx.repos.customers.list(), this.ctx.repos.orders.all()]);
    const q = search?.trim().toLowerCase();
    return customers
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .map((c) => {
        const own = orders.filter((o) => o.customerId === c.id);
        return {
          ...c,
          orders: own.length,
          spentCents: own.filter((o) => isRevenue(o.status)).reduce((s, o) => s + o.totalCents, 0),
          lastOrderAt: own.map((o) => o.createdAt).sort().at(-1) ?? null,
        };
      })
      .sort((a, b) => (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? ""));
  }
}
