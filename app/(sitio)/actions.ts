"use server";
import { createOrder, OrderError, PAYMENTS } from "@/lib/catalog";

export type PlaceOrderInput = {
  name: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  notes: string;
  payment: string;
  items: { variantId: number; qty: number }[];
};

export type PlaceOrderResult = { ok: true; code: string; key: string } | { ok: false; error: string };

const clean = (s: unknown, max = 200) => String(s ?? "").trim().slice(0, max);

export async function placeOrder(raw: PlaceOrderInput): Promise<PlaceOrderResult> {
  const name = clean(raw.name, 80);
  const phone = clean(raw.phone, 20);
  const email = clean(raw.email, 120);
  const address = clean(raw.address, 200);
  const district = clean(raw.district, 60);
  const notes = clean(raw.notes, 300);
  const payment = clean(raw.payment, 40);
  const items = Array.isArray(raw.items)
    ? raw.items
        .map((i) => ({ variantId: Math.trunc(Number(i?.variantId)), qty: Math.trunc(Number(i?.qty)) }))
        .filter((i) => i.variantId > 0 && i.qty > 0 && i.qty <= 50)
    : [];

  if (!items.length) return { ok: false, error: "Tu pedido está vacío. Agrega un producto desde la tienda." };
  if (name.length < 2) return { ok: false, error: "Escribe tu nombre." };
  if (phone.replace(/\D/g, "").length < 9) return { ok: false, error: "Escribe un celular de 9 dígitos para coordinar la entrega." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Revisa el correo: no tiene un formato válido." };
  if (address.length < 5) return { ok: false, error: "Escribe la dirección de entrega." };
  if (district.length < 2) return { ok: false, error: "Escribe el distrito." };
  if (!PAYMENTS.includes(payment as (typeof PAYMENTS)[number])) return { ok: false, error: "Elige cómo vas a pagar." };

  try {
    const { code, key } = createOrder({ name, phone, email, address, district, notes, payment, items });
    return { ok: true, code, key };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "No pudimos guardar el pedido. Inténtalo de nuevo en un momento." };
  }
}
