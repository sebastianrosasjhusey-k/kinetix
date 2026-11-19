"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { setOrderStatus, STATUSES, useDb } from "@/lib/store";
import { money } from "@/lib/types";
import { fmtDate } from "../fmt";

export default function PedidoAdminPage() {
  return (
    <Suspense fallback={null}>
      <PedidoAdmin />
    </Suspense>
  );
}

function PedidoAdmin() {
  const db = useDb();
  const id = Number(useSearchParams().get("id"));
  if (!db) return null;
  const o = db.orders.find((x) => x.id === id);
  if (!o)
    return (
      <>
        <p><Link href="/admin/pedidos">← Pedidos</Link></p>
        <div className="panel" style={{ marginTop: 16 }}>Ese pedido no existe en esta demostración.</div>
      </>
    );
  const phone = o.phone.replace(/\D/g, "");
  const wa = `https://wa.me/${phone.length === 9 ? "51" + phone : phone}?text=${encodeURIComponent(`Hola ${o.customerName.split(" ")[0]}, te escribimos de Kinetix por tu pedido ${o.code}.`)}`;
  return (
    <>
      <p><Link href="/admin/pedidos">← Pedidos</Link></p>
      <h1 style={{ marginTop: 10 }}>{o.code}</h1>
      <p className="adm-sub">
        {fmtDate(o.createdAt)} · <span className={`pill st-${o.status}`}>{STATUSES.find((s) => s.id === o.status)?.label}</span>
        {o.sample && " · pedido de ejemplo"}
      </p>

      <div className="panel">
        <h2>Estado</h2>
        <div className="status-row">
          {STATUSES.map((s) => (
            <button key={s.id} type="button" aria-pressed={o.status === s.id} onClick={() => setOrderStatus(o.id, s.id)}>{s.label}</button>
          ))}
        </div>
        <p className="s-meta" style={{ marginTop: 10 }}>Al cancelar, las unidades vuelven al stock. Si reactivas un pedido cancelado, se descuentan de nuevo.</p>
      </div>

      <div className="panel">
        <h2>Cliente</h2>
        <dl className="dl">
          <dt>Nombre</dt><dd>{o.customerName}</dd>
          <dt>Celular</dt><dd>{o.phone} · <a href={wa} target="_blank" rel="noopener">Escribir por WhatsApp</a></dd>
          {o.email && (<><dt>Correo</dt><dd>{o.email}</dd></>)}
          <dt>Dirección</dt><dd>{o.address}, {o.district}</dd>
          <dt>Pago</dt><dd>{o.payment}</dd>
          {o.notes && (<><dt>Notas</dt><dd>{o.notes}</dd></>)}
        </dl>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Producto</th><th className="num">Cant.</th><th className="num">Precio</th><th className="num">Subtotal</th></tr></thead>
          <tbody>
            {o.items.map((i, n) => (
              <tr key={n}>
                <td>{i.productName} {i.variantName}</td>
                <td className="num">{i.qty}</td>
                <td className="num">{money(i.unitCents)}</td>
                <td className="num">{money(i.unitCents * i.qty)}</td>
              </tr>
            ))}
            <tr><td colSpan={3}><b>Total</b></td><td className="num"><b>{money(o.totalCents)}</b></td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
