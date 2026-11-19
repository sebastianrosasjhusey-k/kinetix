"use client";
import { useState } from "react";
import { money, type Product } from "@/lib/types";
import { PackImage } from "./PackImage";
import { useCart } from "./Cart";

export function Shop() {
  const { products } = useCart();
  if (!products.length) return <p className="lead">Pronto volveremos a tener productos disponibles.</p>;
  return (
    <div className="s-grid">
      {products.map((p) => (
        <Card key={p.id} p={p} />
      ))}
    </div>
  );
}

function Card({ p }: { p: Product }) {
  const { add, lines } = useCart();
  const firstInStock = p.variants.findIndex((v) => v.stock > 0);
  const [sel, setSel] = useState(Math.max(0, firstInStock));
  const [qty, setQty] = useState(1);
  const v = p.variants[sel];
  if (!v) return null;
  const inCart = lines.find((l) => l.variantId === v.id)?.qty ?? 0;
  const left = v.stock - inCart;
  const soldOut = v.stock <= 0;

  return (
    <article className="s-card">
      <div className="s-pic">
        <PackImage slug={p.slug} name={p.name} variant={v.name} />
      </div>
      <div className="s-info">
      <h3 className="disp">{p.name}</h3>
      <p>{p.description}</p>
      <span className="s-meta">{p.tagline} · {p.size}</span>
      <div className="chips" role="group" aria-label="Sabor">
        {p.variants.length > 1 ? (
          p.variants.map((x, i) => (
            <button key={x.id} type="button" className="chip" aria-pressed={i === sel} disabled={x.stock <= 0} onClick={() => { setSel(i); setQty(1); }}>
              <i style={{ background: `#${x.colorA}` }} />
              {x.name}
            </button>
          ))
        ) : (
          <span className="chip fixed"><i style={{ background: `#${v.colorA}` }} />{v.name}</span>
        )}
      </div>
      {p.warning && <span className="s-meta">{p.warning}</span>}
      {soldOut ? <span className="err">Agotado por ahora</span> : left <= 5 && <span className="s-meta">Quedan {Math.max(left, 0)} unidades</span>}
      <div className="s-row">
        <div className="price">
          {money(p.priceCents)}
          {p.compareCents ? <s>{money(p.compareCents)}</s> : null}
        </div>
        <div className="qty">
          <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos">−</button>
          <span>{qty}</span>
          <button type="button" onClick={() => setQty(Math.max(1, Math.min(qty + 1, left)))} aria-label="Más">+</button>
        </div>
      </div>
      <button type="button" className="add" disabled={soldOut || left < 1} onClick={() => { add(v.id, Math.min(qty, left)); setQty(1); }}>
        {soldOut ? "Agotado" : left < 1 ? "Ya tienes todo el stock en tu pedido" : "Agregar al pedido"}
      </button>
      </div>
    </article>
  );
}
