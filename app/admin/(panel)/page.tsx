"use client";
import Link from "next/link";
import { resetDemo, stats, STATUSES, useDb } from "@/lib/store";
import { money } from "@/lib/types";
import { fmtDate } from "./fmt";

export default function Resumen() {
  const db = useDb();
  if (!db) return null;
  const s = stats(db);
  const recent = [...db.orders].sort((a, b) => b.id - a.id).slice(0, 6);
  return (
    <>
      <h1>Resumen</h1>
      <p className="adm-sub">Ventas sin contar pedidos cancelados. Los pedidos “de ejemplo” vienen precargados en la demostración.</p>
      <div className="kpis">
        <div className="kpi"><b>{money(s.today.t)}</b><span>Hoy · {s.today.n} {s.today.n === 1 ? "pedido" : "pedidos"}</span></div>
        <div className="kpi"><b>{money(s.month.t)}</b><span>Este mes · {s.month.n} {s.month.n === 1 ? "pedido" : "pedidos"}</span></div>
        <div className="kpi"><b>{s.pending}</b><span>Pedidos por despachar</span></div>
        <div className="kpi"><b className={s.lowStock.length ? "low" : undefined}>{s.lowStock.length}</b><span>Sabores con 10 unidades o menos</span></div>
      </div>

      {s.lowStock.length > 0 && (
        <div className="panel">
          <h2>Stock bajo</h2>
          <p>
            {s.lowStock.map((l) => `${l.product} ${l.variant}: ${l.stock}`).join(" · ")}. <Link href="/admin/productos">Actualizar stock</Link>
          </p>
        </div>
      )}

      <div className="panel" style={{ padding: 0 }}>
        <h2 style={{ padding: "16px 18px 0" }}>Últimos pedidos</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th className="num">Total</th></tr></thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/pedido?id=${o.id}`}>{o.code}</Link></td>
                  <td>{o.customerName}</td>
                  <td>{fmtDate(o.createdAt)}</td>
                  <td><span className={`pill st-${o.status}`}>{STATUSES.find((x) => x.id === o.status)?.label}</span></td>
                  <td className="num">{money(o.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2>Datos de la demostración</h2>
        <p className="s-meta" style={{ marginBottom: 12 }}>Todo se guarda en este navegador. Restablecer borra tus pedidos de prueba y vuelve a los productos y pedidos de ejemplo.</p>
        <button className="abtn ghost" type="button" onClick={resetDemo}>Restablecer datos de ejemplo</button>
      </div>
    </>
  );
}
