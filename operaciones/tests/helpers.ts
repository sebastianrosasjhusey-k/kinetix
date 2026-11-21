import { createContainer } from "../src/container.js";
import { seedCatalog } from "../src/seed.js";

export async function setup(stock: Record<string, number> = { "CPRIX-NAR": 10, "CPRIX-FRO": 10, "HYD-MAR": 5, "HYD-LIM": 2, "RAW-SS": 5 }) {
  let n = 0;
  const c = createContainer({ clock: { now: () => new Date(Date.UTC(2026, 10, 1, 12, 0, n)) }, ids: { next: () => `id-${++n}` } });
  await seedCatalog(c.repos, c.services, stock);
  return c;
}

export const baseOrder = {
  customer: { name: "Ana Pérez", phone: "+51 987 654 321" },
  address: "Av. Siempre Viva 123",
  district: "Miraflores",
  channel: "whatsapp" as const,
  paymentMethod: "yape_plin" as const,
  items: [{ sku: "CPRIX-NAR", quantity: 2 }],
};
