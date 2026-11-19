"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { money, type Product } from "@/lib/types";
import { Pouch } from "./Pouch";
import { placeOrder } from "@/app/(sitio)/actions";

type Line = { variantId: number; qty: number };
type Ctx = {
  products: Product[];
  lines: Line[];
  add: (variantId: number, qty: number) => void;
  setQty: (variantId: number, qty: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (o: boolean) => void;
};

const CartCtx = createContext<Ctx | null>(null);
export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart fuera de CartProvider");
  return c;
};

const LS_CART = "kx-cart-v2";
const LS_CUST = "kx-cust-v2";
const read = <T,>(k: string, fb: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fb;
  } catch {
    return fb;
  }
};
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

export function CartProvider({ products, children }: { products: Product[]; children: React.ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const valid = new Set(products.flatMap((p) => p.variants.map((v) => v.id)));
    setLines(read<Line[]>(LS_CART, []).filter((l) => valid.has(l.variantId) && l.qty > 0));
    setReady(true);
  }, [products]);
  useEffect(() => {
    if (ready) write(LS_CART, lines);
  }, [lines, ready]);

  const add = useCallback((variantId: number, qty: number) => {
    setLines((ls) => {
      const f = ls.find((l) => l.variantId === variantId);
      return f ? ls.map((l) => (l === f ? { ...l, qty: l.qty + qty } : l)) : [...ls, { variantId, qty }];
    });
    setOpen(true);
  }, []);
  const setQty = useCallback(
    (variantId: number, qty: number) =>
      setLines((ls) => (qty < 1 ? ls.filter((l) => l.variantId !== variantId) : ls.map((l) => (l.variantId === variantId ? { ...l, qty } : l)))),
    []
  );
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => ({ products, lines, add, setQty, clear, open, setOpen }), [products, lines, add, setQty, clear, open]);
  return (
    <CartCtx.Provider value={value}>
      {children}
      <CartDrawer />
      <FloatBar />
    </CartCtx.Provider>
  );
}

function useDetailed() {
  const { products, lines } = useCart();
  return useMemo(() => {
    const rows = lines.flatMap((l) => {
      for (const p of products) {
        const v = p.variants.find((x) => x.id === l.variantId);
        if (v) return [{ ...l, p, v, sub: p.priceCents * l.qty }];
      }
      return [];
    });
    return { rows, total: rows.reduce((s, r) => s + r.sub, 0), count: rows.reduce((s, r) => s + r.qty, 0) };
  }, [products, lines]);
}

export function CartButton() {
  const { setOpen } = useCart();
  const { count } = useDetailed();
  return (
    <button className="cart-btn" type="button" onClick={() => setOpen(true)} aria-label={`Abrir pedido, ${count} productos`}>
      Pedido <b>{count}</b>
    </button>
  );
}

function FloatBar() {
  const { open, setOpen } = useCart();
  const { count, total } = useDetailed();
  if (!count || open) return null;
  return (
    <button className="float-bar" type="button" onClick={() => setOpen(true)}>
      <span>
        {count} {count === 1 ? "producto" : "productos"}
      </span>
      <span>{money(total)} · Pedir</span>
    </button>
  );
}

type Cust = { name: string; phone: string; email: string; address: string; district: string; notes: string; payment: string };
const EMPTY: Cust = { name: "", phone: "", email: "", address: "", district: "", notes: "", payment: "Yape / Plin" };

function CartDrawer() {
  const { open, setOpen, setQty, clear } = useCart();
  const { rows, total } = useDetailed();
  const router = useRouter();
  const [c, setC] = useState<Cust>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setC({ ...EMPTY, ...read<Partial<Cust>>(LS_CUST, {}), notes: "" }), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;
  const set = (k: keyof Cust) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setC({ ...c, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { notes: _n, ...keep } = c;
    write(LS_CUST, keep);
    const r = await placeOrder({ ...c, items: rows.map((r) => ({ variantId: r.variantId, qty: r.qty })) });
    if (r.ok) {
      clear();
      setOpen(false);
      router.push(`/pedido/${r.code}?k=${r.key}`);
    } else {
      setError(r.error);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <>
      <div className="scrim" onClick={() => setOpen(false)} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Tu pedido">
        <div className="d-head">
          <h2 className="disp">Tu pedido</h2>
          <button className="x" type="button" onClick={() => setOpen(false)} aria-label="Cerrar">×</button>
        </div>
        {!rows.length ? (
          <div className="d-body">
            <p className="empty">
              Tu pedido está vacío. Elige un producto en la{" "}
              <Link href="/tienda" onClick={() => setOpen(false)}>
                tienda
              </Link>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "contents" }}>
            <div className="d-body">
              {rows.map((r) => (
                <div className="c-it" key={r.variantId}>
                  <Pouch name={r.p.name} variant={r.v.name} style={r.p.style} colorA={r.v.colorA} colorB={r.v.colorB} size={r.p.size} label={false} />
                  <div className="c-n">
                    {r.p.name}
                    <small>
                      {r.v.name} · {money(r.sub)}
                    </small>
                  </div>
                  <div className="qty">
                    <button type="button" onClick={() => setQty(r.variantId, r.qty - 1)} aria-label={`Quitar uno de ${r.p.name} ${r.v.name}`}>−</button>
                    <span>{r.qty}</span>
                    <button type="button" onClick={() => setQty(r.variantId, Math.min(r.qty + 1, r.v.stock))} aria-label={`Agregar uno de ${r.p.name} ${r.v.name}`}>+</button>
                  </div>
                </div>
              ))}
              <div className="form">
                <label>Nombre y apellido<input id="c-name" required value={c.name} onChange={set("name")} autoComplete="name" /></label>
                <div className="row2">
                  <label>Celular<input id="c-phone" required value={c.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" /></label>
                  <label>Distrito<input id="c-district" required value={c.district} onChange={set("district")} autoComplete="address-level2" /></label>
                </div>
                <label>Dirección de entrega<input id="c-address" required value={c.address} onChange={set("address")} autoComplete="street-address" /></label>
                <label>Correo (opcional)<input id="c-email" type="email" value={c.email} onChange={set("email")} autoComplete="email" /></label>
                <fieldset className="pay-opts" style={{ border: 0, padding: 0 }}>
                  <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Cómo vas a pagar</legend>
                  {["Yape / Plin", "Transferencia bancaria", "Efectivo contra entrega"].map((p) => (
                    <label key={p}>
                      <input type="radio" name="payment" value={p} checked={c.payment === p} onChange={() => setC({ ...c, payment: p })} />
                      {p}
                    </label>
                  ))}
                </fieldset>
                <label>Notas para la entrega (opcional)<textarea id="c-notes" value={c.notes} onChange={set("notes")} /></label>
              </div>
            </div>
            <div className="d-foot">
              <div className="tot">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
              {error && <p className="err" role="alert">{error}</p>}
              <button className="submit" type="submit" disabled={busy}>
                {busy ? "Confirmando…" : "Confirmar pedido"}
              </button>
              <p className="fine">Te escribimos por WhatsApp para coordinar el pago y la entrega. Precios con IGV incluido.</p>
            </div>
          </form>
        )}
      </aside>
    </>
  );
}
