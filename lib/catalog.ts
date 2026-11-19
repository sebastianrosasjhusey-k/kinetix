import "server-only";
import crypto from "node:crypto";
import { db, tx } from "./db";
import type { Product, Variant } from "./types";

type ProductRow = Omit<Product, "variants" | "active"> & { active: number };
type VariantRow = Omit<Variant, "active"> & { active: number; product_id: number };

export function listProducts(opts: { includeInactive?: boolean } = {}): Product[] {
  const d = db();
  const products = d
    .prepare(
      `SELECT id,slug,name,tagline,description,size,price_cents AS priceCents,compare_cents AS compareCents,
              warning,style,active FROM products ${opts.includeInactive ? "" : "WHERE active=1"} ORDER BY sort,id`
    )
    .all() as unknown as ProductRow[];
  const variants = d
    .prepare(
      `SELECT id,product_id,name,color_a AS colorA,color_b AS colorB,stock,active FROM variants
       ${opts.includeInactive ? "" : "WHERE active=1"} ORDER BY sort,id`
    )
    .all() as unknown as VariantRow[];
  return products.map((p) => ({
    ...p,
    active: !!p.active,
    variants: variants
      .filter((v) => v.product_id === p.id)
      .map(({ product_id: _pid, ...v }) => ({ ...v, active: !!v.active })),
  }));
}

export type OrderInput = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  district: string;
  notes?: string;
  payment: string;
  items: { variantId: number; qty: number }[];
};

export const PAYMENTS = ["Yape / Plin", "Transferencia bancaria", "Efectivo contra entrega"] as const;

export class OrderError extends Error {}

/** Crea el pedido con precios tomados de la BD y descuenta stock. */
export function createOrder(input: OrderInput): { code: string; key: string } {
  return tx((d) => {
    const getV = d.prepare(
      `SELECT v.id, v.name AS vname, v.stock, v.active AS va, p.name AS pname, p.price_cents, p.active AS pa
       FROM variants v JOIN products p ON p.id=v.product_id WHERE v.id=?`
    );
    const merged = new Map<number, number>();
    for (const it of input.items) merged.set(it.variantId, (merged.get(it.variantId) || 0) + it.qty);

    const lines: { id: number; pname: string; vname: string; unit: number; qty: number }[] = [];
    for (const [variantId, qty] of merged) {
      const v = getV.get(variantId) as
        | { id: number; vname: string; stock: number; va: number; pname: string; price_cents: number; pa: number }
        | undefined;
      if (!v || !v.va || !v.pa) throw new OrderError("Uno de los productos ya no está disponible. Actualiza tu pedido.");
      if (v.stock < qty)
        throw new OrderError(
          v.stock > 0
            ? `Solo quedan ${v.stock} unidades de ${v.pname} ${v.vname}. Ajusta la cantidad.`
            : `${v.pname} ${v.vname} está agotado. Quítalo de tu pedido.`
        );
      lines.push({ id: v.id, pname: v.pname, vname: v.vname, unit: v.price_cents, qty });
    }
    const total = lines.reduce((s, l) => s + l.unit * l.qty, 0);
    const last = d.prepare("SELECT MAX(id) AS m FROM orders").get() as { m: number | null };
    const code = `KX-${1001 + (last.m || 0)}`;
    const key = crypto.randomBytes(6).toString("hex");
    const r = d
      .prepare(
        `INSERT INTO orders (code,public_key,customer_name,phone,email,address,district,notes,payment,total_cents)
         VALUES (?,?,?,?,?,?,?,?,?,?)`
      )
      .run(code, key, input.name, input.phone, input.email || null, input.address, input.district, input.notes || null, input.payment, total);
    const orderId = Number(r.lastInsertRowid);
    const insI = d.prepare(
      "INSERT INTO order_items (order_id,variant_id,product_name,variant_name,unit_cents,qty) VALUES (?,?,?,?,?,?)"
    );
    const dec = d.prepare("UPDATE variants SET stock = stock - ? WHERE id=?");
    for (const l of lines) {
      insI.run(orderId, l.id, l.pname, l.vname, l.unit, l.qty);
      dec.run(l.qty, l.id);
    }
    return { code, key };
  });
}

export type OrderSummary = {
  id: number;
  code: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  district: string;
  notes: string | null;
  payment: string;
  status: string;
  totalCents: number;
  createdAt: string;
  items: { productName: string; variantName: string; unitCents: number; qty: number }[];
};

const ORDER_COLS = `id,code,customer_name AS customerName,phone,email,address,district,notes,payment,status,
  total_cents AS totalCents,created_at AS createdAt`;

function withItems(orders: Omit<OrderSummary, "items">[]): OrderSummary[] {
  if (!orders.length) return [];
  const d = db();
  const items = d
    .prepare(
      `SELECT order_id AS orderId, product_name AS productName, variant_name AS variantName, unit_cents AS unitCents, qty
       FROM order_items WHERE order_id IN (${orders.map(() => "?").join(",")}) ORDER BY id`
    )
    .all(...orders.map((o) => o.id)) as unknown as ({ orderId: number } & OrderSummary["items"][number])[];
  return orders.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id).map(({ orderId: _o, ...i }) => i) }));
}

/** Para la página pública de confirmación: exige el código y su clave. */
export function getOrderByCode(code: string, key: string): OrderSummary | null {
  const o = db().prepare(`SELECT ${ORDER_COLS} FROM orders WHERE code=? AND public_key=?`).get(code, key) as Omit<OrderSummary, "items"> | undefined;
  return o ? withItems([o])[0] : null;
}

export function getOrder(id: number): OrderSummary | null {
  const o = db().prepare(`SELECT ${ORDER_COLS} FROM orders WHERE id=?`).get(id) as Omit<OrderSummary, "items"> | undefined;
  return o ? withItems([o])[0] : null;
}

export function listOrders(status?: string): OrderSummary[] {
  const d = db();
  const rows = (status
    ? d.prepare(`SELECT ${ORDER_COLS} FROM orders WHERE status=? ORDER BY id DESC LIMIT 300`).all(status)
    : d.prepare(`SELECT ${ORDER_COLS} FROM orders ORDER BY id DESC LIMIT 300`).all()) as unknown as Omit<OrderSummary, "items">[];
  return withItems(rows);
}

export const STATUSES = [
  { id: "nuevo", label: "Nuevo" },
  { id: "confirmado", label: "Confirmado" },
  { id: "pagado", label: "Pagado" },
  { id: "enviado", label: "Enviado" },
  { id: "entregado", label: "Entregado" },
  { id: "cancelado", label: "Cancelado" },
] as const;

/** Cambia el estado; al cancelar devuelve el stock y al reactivar lo vuelve a descontar. */
export function setOrderStatus(id: number, status: string) {
  if (!STATUSES.some((s) => s.id === status)) throw new OrderError("Estado no válido.");
  tx((d) => {
    const o = d.prepare("SELECT status FROM orders WHERE id=?").get(id) as { status: string } | undefined;
    if (!o) throw new OrderError("El pedido no existe.");
    if (o.status === status) return;
    const items = d.prepare("SELECT variant_id AS v, qty FROM order_items WHERE order_id=? AND variant_id IS NOT NULL").all(id) as unknown as { v: number; qty: number }[];
    const upd = d.prepare("UPDATE variants SET stock = stock + ? WHERE id=?");
    if (status === "cancelado") items.forEach((i) => upd.run(i.qty, i.v));
    if (o.status === "cancelado") items.forEach((i) => upd.run(-i.qty, i.v));
    d.prepare("UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?").run(status, id);
  });
}

export function updateProduct(id: number, f: { priceCents: number; compareCents: number | null; active: boolean; description: string; tagline: string; size: string }) {
  db().prepare(
    "UPDATE products SET price_cents=?, compare_cents=?, active=?, description=?, tagline=?, size=? WHERE id=?"
  ).run(f.priceCents, f.compareCents, f.active ? 1 : 0, f.description, f.tagline, f.size, id);
}

export function updateVariant(id: number, f: { stock: number; active: boolean }) {
  db().prepare("UPDATE variants SET stock=?, active=? WHERE id=?").run(f.stock, f.active ? 1 : 0, id);
}

export function stats() {
  const d = db();
  const row = (sql: string) => d.prepare(sql).get() as Record<string, number>;
  return {
    today: row(`SELECT COUNT(*) AS n, COALESCE(SUM(total_cents),0) AS t FROM orders WHERE status!='cancelado' AND date(created_at)=date('now')`),
    month: row(`SELECT COUNT(*) AS n, COALESCE(SUM(total_cents),0) AS t FROM orders WHERE status!='cancelado' AND strftime('%Y-%m',created_at)=strftime('%Y-%m','now')`),
    pending: row(`SELECT COUNT(*) AS n FROM orders WHERE status IN ('nuevo','confirmado','pagado')`).n,
    lowStock: d.prepare(
      `SELECT p.name AS product, v.name AS variant, v.stock FROM variants v JOIN products p ON p.id=v.product_id
       WHERE v.active=1 AND p.active=1 AND v.stock<=10 ORDER BY v.stock`
    ).all() as unknown as { product: string; variant: string; stock: number }[],
  };
}
