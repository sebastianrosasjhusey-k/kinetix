"use client";
/**
 * Base de datos de demostración que vive en el navegador (localStorage).
 * Imita las tablas de la versión con servidor (rama app-nextjs): productos,
 * sabores con stock, pedidos, usuarios y sesión. Cada visitante tiene su copia.
 */
import { useSyncExternalStore } from "react";
import type { Product } from "./types";

export type OrderItem = { variantId: number; productName: string; variantName: string; unitCents: number; qty: number };
export type Order = {
  id: number;
  code: string;
  key: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  district: string;
  notes: string | null;
  payment: string;
  status: string;
  totalCents: number;
  createdAt: string; // ISO
  items: OrderItem[];
  sample?: boolean;
};
type User = { id: number; email: string; name: string; passHash: string };
type Data = { version: number; seededAt: string; products: Product[]; orders: Order[]; users: User[]; session: number | null };

const KEY = "kx-demo-db";
const VERSION = 1;

export const PAYMENTS = ["Yape / Plin", "Transferencia bancaria", "Efectivo contra entrega"] as const;
export const STATUSES = [
  { id: "nuevo", label: "Nuevo" },
  { id: "confirmado", label: "Confirmado" },
  { id: "pagado", label: "Pagado" },
  { id: "enviado", label: "Enviado" },
  { id: "entregado", label: "Entregado" },
  { id: "cancelado", label: "Cancelado" },
] as const;

export class OrderError extends Error {}

// Hash de "kinetix2026" (SHA-256), para no guardar la contraseña en texto plano.
const DEMO_HASH = "68d7b36d8f3d43467f6a35e9e502a705907804a4f77841b2705c7219981663df";

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function seed(): Data {
  const products: Product[] = [
    {
      id: 1, slug: "c-prix", name: "C-PRIX", tagline: "Carbohidratos + electrolitos",
      description: "25 g de carbohidratos y 200 mg de sodio por scoop, con sal rosada amazónica. Ratio 1:0.8 maltodextrina + fructosa.",
      size: "900 g · 34 porciones", priceCents: 9500, compareCents: 11000, warning: "Alto en azúcar · Alto en sodio", style: "cream", active: true,
      variants: [
        { id: 1, name: "Naranja", colorA: "EC6B3B", colorB: "F0C020", stock: 57, active: true },
        { id: 2, name: "Frutos Rojos", colorA: "B41B6E", colorB: "EB5FA3", stock: 54, active: true },
      ],
    },
    {
      id: 2, slug: "hyd-prix", name: "HYD-PRIX", tagline: "Electrolitos en polvo",
      description: "300 mg de sodio, 150 mg de potasio, 63 mg de calcio y 36 mg de magnesio por porción. Sabor natural, sin colorantes.",
      size: "100 g · 33 porciones", priceCents: 3900, compareCents: null, warning: null, style: "dark", active: true,
      variants: [
        { id: 3, name: "Maracumango", colorA: "F7922B", colorB: "F7922B", stock: 38, active: true },
        { id: 4, name: "Limón", colorA: "A7CF3A", colorB: "A7CF3A", stock: 8, active: true },
      ],
    },
    {
      id: 3, slug: "raw", name: "RAW", tagline: "Electrolitos sin sabor",
      description: "La misma composición de electrolitos que HYD-PRIX, sin saborizantes ni colorantes. Ideal para mezclar con C-PRIX.",
      size: "100 g · 33 porciones", priceCents: 3500, compareCents: null, warning: null, style: "light", active: true,
      variants: [{ id: 5, name: "Sin sabor", colorA: "2A8FD4", colorB: "2A8FD4", stock: 39, active: true }],
    },
  ];
  const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
  const it = (variantId: number, qty: number): OrderItem => {
    const p = products.find((x) => x.variants.some((v) => v.id === variantId))!;
    const v = p.variants.find((x) => x.id === variantId)!;
    return { variantId, productName: p.name, variantName: v.name, unitCents: p.priceCents, qty };
  };
  const mk = (id: number, name: string, district: string, payment: string, status: string, h: number, items: OrderItem[]): Order => ({
    id, code: `KX-${1000 + id}`, key: `ejemplo${id}`, customerName: name, phone: `9${String(10000000 + id * 7311).slice(0, 8)}`,
    email: null, address: "Dirección de ejemplo", district, notes: null, payment, status, createdAt: ago(h), items,
    totalCents: items.reduce((s, i) => s + i.unitCents * i.qty, 0), sample: true,
  });
  const orders = [
    mk(1, "Cliente de ejemplo 1", "San Borja", "Yape / Plin", "entregado", 96, [it(1, 2), it(5, 1)]),
    mk(2, "Cliente de ejemplo 2", "Miraflores", "Transferencia bancaria", "enviado", 30, [it(2, 3)]),
    mk(3, "Cliente de ejemplo 3", "Surco", "Yape / Plin", "pagado", 5, [it(1, 1), it(3, 2)]),
    mk(4, "Cliente de ejemplo 4", "La Molina", "Efectivo contra entrega", "nuevo", 1, [it(4, 2), it(1, 1)]),
  ];
  return {
    version: VERSION,
    seededAt: new Date().toISOString(),
    products,
    orders,
    users: [{ id: 1, email: "admin@kinetix.pe", name: "Administrador", passHash: DEMO_HASH }],
    session: null,
  };
}

let cache: Data | null = null;
const listeners = new Set<() => void>();

function load(): Data {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const d = raw ? (JSON.parse(raw) as Data) : null;
    cache = d && d.version === VERSION ? d : seed();
  } catch {
    cache = seed();
  }
  return cache;
}

function commit(next: Data) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};

/** Lee la base de datos de demo desde un componente. En el servidor (build) devuelve null. */
export function useDb(): Data | null {
  return useSyncExternalStore(subscribe, load, () => null);
}

const clone = (): Data => structuredClone(load());

export const activeProducts = (d: Data) =>
  d.products.filter((p) => p.active).map((p) => ({ ...p, variants: p.variants.filter((v) => v.active) })).filter((p) => p.variants.length);

export function createOrder(input: {
  name: string; phone: string; email: string; address: string; district: string; notes: string; payment: string;
  items: { variantId: number; qty: number }[];
}): { code: string; key: string } {
  const d = clone();
  const merged = new Map<number, number>();
  for (const i of input.items) merged.set(i.variantId, (merged.get(i.variantId) || 0) + i.qty);
  const items: OrderItem[] = [];
  for (const [variantId, qty] of merged) {
    const p = d.products.find((x) => x.variants.some((v) => v.id === variantId));
    const v = p?.variants.find((x) => x.id === variantId);
    if (!p || !v || !p.active || !v.active) throw new OrderError("Uno de los productos ya no está disponible. Actualiza tu pedido.");
    if (v.stock < qty)
      throw new OrderError(v.stock > 0 ? `Solo quedan ${v.stock} unidades de ${p.name} ${v.name}. Ajusta la cantidad.` : `${p.name} ${v.name} está agotado. Quítalo de tu pedido.`);
    v.stock -= qty;
    items.push({ variantId, productName: p.name, variantName: v.name, unitCents: p.priceCents, qty });
  }
  const id = Math.max(0, ...d.orders.map((o) => o.id)) + 1;
  const key = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("");
  const order: Order = {
    id, code: `KX-${1000 + id}`, key, customerName: input.name, phone: input.phone, email: input.email || null,
    address: input.address, district: input.district, notes: input.notes || null, payment: input.payment,
    status: "nuevo", totalCents: items.reduce((s, i) => s + i.unitCents * i.qty, 0), createdAt: new Date().toISOString(), items,
  };
  d.orders.push(order);
  commit(d);
  return { code: order.code, key };
}

export function setOrderStatus(id: number, status: string) {
  const d = clone();
  const o = d.orders.find((x) => x.id === id);
  if (!o || o.status === status) return;
  const delta = status === "cancelado" ? 1 : o.status === "cancelado" ? -1 : 0;
  if (delta)
    for (const i of o.items)
      for (const p of d.products) {
        const v = p.variants.find((x) => x.id === i.variantId);
        if (v) v.stock += delta * i.qty;
      }
  o.status = status;
  commit(d);
}

export function updateProduct(id: number, f: Pick<Product, "priceCents" | "compareCents" | "active" | "description" | "tagline" | "size">, variants: { id: number; stock: number; active: boolean }[]) {
  const d = clone();
  const p = d.products.find((x) => x.id === id);
  if (!p) return;
  Object.assign(p, f);
  for (const v of variants) {
    const t = p.variants.find((x) => x.id === v.id);
    if (t) Object.assign(t, { stock: v.stock, active: v.active });
  }
  commit(d);
}

export async function login(email: string, password: string): Promise<boolean> {
  const d = clone();
  const u = d.users.find((x) => x.email === email.trim().toLowerCase());
  const h = await sha256(password);
  if (!u || u.passHash !== h) return false;
  d.session = u.id;
  commit(d);
  return true;
}

export function logout() {
  const d = clone();
  d.session = null;
  commit(d);
}

export const currentUser = (d: Data | null) => (d && d.session ? d.users.find((u) => u.id === d.session) ?? null : null);

export async function changePassword(current: string, next: string): Promise<string | null> {
  const d = clone();
  const u = d.users.find((x) => x.id === d.session);
  if (!u || u.passHash !== (await sha256(current))) return "La contraseña actual no es correcta.";
  if (next.length < 8) return "La nueva contraseña debe tener al menos 8 caracteres.";
  u.passHash = await sha256(next);
  commit(d);
  return null;
}

/** Vuelve a los datos de ejemplo iniciales (mantiene la sesión abierta). */
export function resetDemo() {
  const s = load().session;
  commit({ ...seed(), session: s });
}

export function stats(d: Data) {
  const live = d.orders.filter((o) => o.status !== "cancelado");
  const day = (iso: string) => new Date(iso).toLocaleDateString("es-PE", { timeZone: "America/Lima" });
  const month = (iso: string) => new Date(iso).toLocaleDateString("es-PE", { timeZone: "America/Lima", month: "numeric", year: "numeric" });
  const now = new Date().toISOString();
  const sum = (os: Order[]) => ({ n: os.length, t: os.reduce((s, o) => s + o.totalCents, 0) });
  return {
    today: sum(live.filter((o) => day(o.createdAt) === day(now))),
    month: sum(live.filter((o) => month(o.createdAt) === month(now))),
    pending: d.orders.filter((o) => ["nuevo", "confirmado", "pagado"].includes(o.status)).length,
    lowStock: d.products
      .filter((p) => p.active)
      .flatMap((p) => p.variants.filter((v) => v.active && v.stock <= 10).map((v) => ({ product: p.name, variant: v.name, stock: v.stock }))),
  };
}
