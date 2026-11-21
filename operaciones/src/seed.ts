import type { Product, Variant } from "./domain/product.js";
import type { Services } from "./container.js";
import type { Repositories } from "./ports/repositories.js";

/** Catálogo real de Kinetix (mismos precios que la tienda web). */
export const PRODUCTS: Product[] = [
  {
    id: "c-prix",
    name: "C-PRIX",
    description: "Carbohidratos + electrolitos. 25 g de carbohidratos y 200 mg de sodio por scoop.",
    size: "900 g · 34 porciones",
    priceCents: 9500,
    active: true,
  },
  {
    id: "hyd-prix",
    name: "HYD-PRIX",
    description: "Electrolitos en polvo: 300 mg sodio, 150 mg potasio, 63 mg calcio, 36 mg magnesio.",
    size: "100 g · 33 porciones",
    priceCents: 3500,
    active: true,
  },
  {
    id: "raw",
    name: "RAW",
    description: "Electrolitos sin sabor, ideal para mezclar con C-PRIX.",
    size: "100 g · 33 porciones",
    priceCents: 3000,
    active: true,
  },
];

export const VARIANTS: Omit<Variant, "stock">[] = [
  { sku: "CPRIX-NAR", productId: "c-prix", flavor: "Naranja", reorderLevel: 10, active: true },
  { sku: "CPRIX-FRO", productId: "c-prix", flavor: "Frutos Rojos", reorderLevel: 10, active: true },
  { sku: "HYD-MAR", productId: "hyd-prix", flavor: "Maracumango", reorderLevel: 10, active: true },
  { sku: "HYD-LIM", productId: "hyd-prix", flavor: "Limón", reorderLevel: 10, active: true },
  { sku: "RAW-SS", productId: "raw", flavor: "Sin sabor", reorderLevel: 10, active: true },
];

const INITIAL_STOCK: Record<string, number> = { "CPRIX-NAR": 60, "CPRIX-FRO": 55, "HYD-MAR": 40, "HYD-LIM": 12, "RAW-SS": 40 };

/** Carga el catálogo con stock en 0 y registra el stock inicial como "entrada" (queda en el libro). */
export async function seedCatalog(repos: Repositories, services: Services, stock = INITIAL_STOCK): Promise<void> {
  for (const p of PRODUCTS) await repos.products.save(p);
  for (const v of VARIANTS) await repos.variants.save({ ...v, stock: 0 });
  for (const [sku, qty] of Object.entries(stock))
    if (qty > 0) await services.inventory.moveStock({ sku, type: "entrada", quantity: qty, reason: "Stock inicial", actor: "sistema" });
}

/** Pedidos de ejemplo para explorar la herramienta. Usa los servicios reales. */
export async function seedDemoOrders(services: Services): Promise<void> {
  const demo = [
    { name: "Cliente Ejemplo 1", phone: "987654321", district: "San Borja", pay: "yape_plin", items: [["CPRIX-NAR", 2], ["RAW-SS", 1]], to: ["confirmado", "pagado", "enviado", "entregado"] },
    { name: "Cliente Ejemplo 2", phone: "912345678", district: "Miraflores", pay: "transferencia", items: [["CPRIX-FRO", 3]], to: ["confirmado", "pagado", "enviado"] },
    { name: "Cliente Ejemplo 3", phone: "998877665", district: "Surco", pay: "yape_plin", items: [["CPRIX-NAR", 1], ["HYD-MAR", 2]], to: ["confirmado", "pagado"] },
    { name: "Cliente Ejemplo 4", phone: "955443322", district: "La Molina", pay: "efectivo_contra_entrega", items: [["HYD-LIM", 2], ["CPRIX-NAR", 1]], to: [] },
  ] as const;
  for (const d of demo) {
    const { order } = await services.orders.create(
      {
        customer: { name: d.name, phone: d.phone },
        address: "Dirección de ejemplo",
        district: d.district,
        channel: "whatsapp",
        paymentMethod: d.pay,
        items: d.items.map(([sku, quantity]) => ({ sku, quantity })),
      },
      "sistema",
    );
    let version = order.version;
    for (const to of d.to) version = (await services.orders.changeStatus(order.id, { to, expectedVersion: version }, "sistema")).version;
  }
}
