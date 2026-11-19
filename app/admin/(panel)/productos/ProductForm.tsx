"use client";
import { startTransition, useActionState } from "react";
import type { Product } from "@/lib/types";
import { productAction } from "../../actions";

export function ProductForm({ p }: { p: Product }) {
  const [state, action, pending] = useActionState(productAction, undefined);
  const id = (k: string) => `p${p.id}-${k}`;
  return (
    <form
      className="panel"
      // Envío manual para que un error no borre lo que se estaba editando.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="id" value={p.id} />
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
          <input type="hidden" name="variant" value={v.id} />
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
        <button className="abtn" type="submit" disabled={pending}>{pending ? "Guardando…" : `Guardar ${p.name}`}</button>
        {state?.ok && <span className="ok-msg" role="status">{state.ok}</span>}
        {state?.error && <span className="err" role="alert">{state.error}</span>}
      </div>
    </form>
  );
}
