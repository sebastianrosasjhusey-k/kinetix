import { isRevenue, ORDER_STATUSES, type OrderStatus } from "../domain/order.js";
import type { ServiceContext } from "./context.js";

export interface Summary {
  range: { from: string | null; to: string | null };
  ordersByStatus: Record<OrderStatus, number>;
  revenueCents: number;
  /** Pedidos activos aún no cobrados (nuevo/confirmado/enviado contra entrega). */
  pendingCollectionCents: number;
  averageTicketCents: number;
  unitsBySku: { sku: string; product: string; flavor: string; units: number; revenueCents: number }[];
  byDistrict: { district: string; orders: number }[];
  lowStock: { sku: string; product: string; flavor: string; stock: number; reorderLevel: number }[];
}

export class ReportService {
  constructor(private readonly ctx: ServiceContext) {}

  async summary(range: { from?: string; to?: string } = {}): Promise<Summary> {
    const [allOrders, variants, products] = await Promise.all([
      this.ctx.repos.orders.all(),
      this.ctx.repos.variants.list(),
      this.ctx.repos.products.list(),
    ]);
    const orders = allOrders.filter((o) => (!range.from || o.createdAt >= range.from) && (!range.to || o.createdAt <= range.to));
    const sold = orders.filter((o) => isRevenue(o.status));

    const ordersByStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
    for (const o of orders) ordersByStatus[o.status]++;

    const units = new Map<string, Summary["unitsBySku"][number]>();
    for (const o of sold)
      for (const l of o.lines) {
        const u = units.get(l.sku) ?? { sku: l.sku, product: l.productName, flavor: l.flavor, units: 0, revenueCents: 0 };
        u.units += l.quantity;
        u.revenueCents += l.lineTotalCents;
        units.set(l.sku, u);
      }

    const districts = new Map<string, number>();
    for (const o of orders.filter((x) => x.status !== "cancelado")) districts.set(o.district, (districts.get(o.district) ?? 0) + 1);

    const revenueCents = sold.reduce((s, o) => s + o.totalCents, 0);
    const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id;

    return {
      range: { from: range.from ?? null, to: range.to ?? null },
      ordersByStatus,
      revenueCents,
      pendingCollectionCents: orders
        .filter((o) => o.status === "nuevo" || o.status === "confirmado" || (o.status === "enviado" && !o.history.some((h) => h.to === "pagado")))
        .reduce((s, o) => s + o.totalCents, 0),
      averageTicketCents: sold.length ? Math.round(revenueCents / sold.length) : 0,
      unitsBySku: [...units.values()].sort((a, b) => b.units - a.units),
      byDistrict: [...districts.entries()].map(([district, n]) => ({ district, orders: n })).sort((a, b) => b.orders - a.orders),
      lowStock: variants
        .filter((v) => v.active && v.stock <= v.reorderLevel)
        .map((v) => ({ sku: v.sku, product: productName(v.productId), flavor: v.flavor, stock: v.stock, reorderLevel: v.reorderLevel }))
        .sort((a, b) => a.stock - b.stock),
    };
  }
}
