import Link from "next/link";
import { listOrders, stats, STATUSES } from "@/lib/catalog";
import { money } from "@/lib/types";
import { fmtDate } from "./fmt";

export const metadata = { title: "Resumen" };

export default function Resumen() {
  const s = stats();
  const recent = listOrders().slice(0, 6);
  return (
    <>
      <h1>Resumen</h1>
      <p className="adm-sub">Ventas sin contar pedidos cancelados.</p>
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
            {s.lowStock.map((l) => `${l.product} ${l.variant}: ${l.stock}`).join(" · ")}.{" "}
            <Link href="/admin/productos">Actualizar stock</Link>
          </p>
        </div>
      )}

      <div className="panel" style={{ padding: 0 }}>
        <h2 style={{ padding: "16px 18px 0" }}>Últimos pedidos</h2>
        {recent.length ? (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th className="num">Total</th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/pedidos/${o.id}`}>{o.code}</Link></td>
                    <td>{o.customerName}</td>
                    <td>{fmtDate(o.createdAt)}</td>
                    <td><span className={`pill st-${o.status}`}>{STATUSES.find((x) => x.id === o.status)?.label}</span></td>
                    <td className="num">{money(o.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ padding: 18 }}>Todavía no hay pedidos. Cuando un cliente confirme uno en la tienda, aparecerá aquí.</p>
        )}
      </div>
    </>
  );
}
