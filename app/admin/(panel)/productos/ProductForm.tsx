"use client";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { updateProduct } from "@/lib/store";

const cents = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").replace(",", ".").trim();
  if (!s) return null;
  const n = Math.round(Number(s) * 100);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

export function ProductForm({ p }: { p: Product }) {
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const id = (k: string) => `p${p.id}-${k}`;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const price = cents(fd.get("price"));
    const compare = cents(fd.get("compare"));
    if (price === null || Number.isNaN(price) || price <= 0) return setMsg({ error: "Escribe un precio mayor que 0, por ejemplo 95.00." });
    if (Number.isNaN(compare)) return setMsg({ error: "El precio anterior no es un número válido." });
    if (compare !== null && compare <= price) return setMsg({ error: "El precio anterior debe ser mayor que el precio actual, o déjalo vacío." });
    const variants = [];
    for (const v of p.variants) {
      const stock = Number(fd.get(`stock-${v.id}`));
      if (!Number.isInteger(stock) || stock < 0) return setMsg({ error: "El stock debe ser un número entero de 0 o más." });
      variants.push({ id: v.id, stock, active: fd.get(`active-${v.id}`) === "on" });
    }
    updateProduct(
      p.id,
      {
        priceCents: price,
        compareCents: compare,
        active: fd.get("active") === "on",
        tagline: String(fd.get("tagline") || "").slice(0, 80),
        size: String(fd.get("size") || "").slice(0, 60),
        description: String(fd.get("description") || "").slice(0, 400),
      },
      variants
    );
    setMsg({ ok: "Guardado. La tienda ya muestra los cambios." });
  }

  return (
    <form className="panel" onSubmit={submit}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <h2 style={{ margin: 0, font: "400 30px/1 var(--display)" }}>{p.name}</h2>
        <label className="check"><input id={id("active")} type="checkbox" name="active" defaultChecked={p.active} /> Visible en la tienda</label>
      </div>
      <div className="fgrid">
        <label className="field">Precio (S/)<input id={id("price")} name="price" inputMode="decimal" defaultValue={(p.priceCents / 100).toFixed(2)} required /></label>
        <label className="field">Precio anterior tachado (S/)<input id={id("compare")} name="compare" inputMode="decimal" defaultValue={p.compareCents ? (p.compareCents / 100).toFixed(2) : ""} placeholder="Vacío si no hay oferta" /></label>
        <label className="field">Subtítulo<input id={id("tagline")} name="tagline" defaultValue={p.tagline} /></label>
        <label className="field">Presentación<input id={id("size")} name="size" defaultValue={p.size} /></label>
      </div>
      <label className="field" style={{ marginTop: 12 }}>Descripción<textarea id={id("description")} name="description" defaultValue={p.description} /></label>

      <h2 style={{ marginTop: 18 }}>Sabores y stock</h2>
      {p.variants.map((v) => (
        <div className="vrow" key={v.id}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
            <i style={{ width: 14, height: 14, borderRadius: "50%", background: `#${v.colorA}`, display: "inline-block" }} />
            {v.name}
            {v.stock <= 10 && <span className="low" style={{ fontSize: 13 }}>· stock bajo</span>}
          </span>
          <label className="field">Unidades<input id={id(`stock-${v.id}`)} name={`stock-${v.id}`} type="number" min={0} step={1} defaultValue={v.stock} required /></label>
          <label className="check" style={{ paddingBottom: 10 }}><input id={id(`va-${v.id}`)} type="checkbox" name={`active-${v.id}`} defaultChecked={v.active} /> Activo</label>
        </div>
      ))}

      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
        <button className="abtn" type="submit">Guardar {p.name}</button>
        {msg.ok && <span className="ok-msg" role="status">{msg.ok}</span>}
        {msg.error && <span className="err" role="alert">{msg.error}</span>}
      </div>
    </form>
  );
}
