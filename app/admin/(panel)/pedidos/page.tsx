import Link from "next/link";
import { listOrders, STATUSES } from "@/lib/catalog";
import { money } from "@/lib/types";
import { fmtDate } from "../fmt";

export const metadata = { title: "Pedidos" };

export default async function Pedidos({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const valid = STATUSES.some((s) => s.id === estado) ? estado : undefined;
  const orders = listOrders(valid);
  return (
    <>
      <h1>Pedidos</h1>
      <p className="adm-sub">Abre un pedido para ver los datos del cliente y cambiar su estado.</p>
      <nav className="filters" aria-label="Filtrar por estado">
        <Link href="/admin/pedidos" aria-current={!valid ? "page" : undefined}>Todos</Link>
        {STATUSES.map((s) => (
          <Link key={s.id} href={`/admin/pedidos?estado=${s.id}`} aria-current={valid === s.id ? "page" : undefined}>{s.label}</Link>
        ))}
      </nav>
      {orders.length ? (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Pedido</th><th>Cliente</th><th>Productos</th><th>Pago</th><th>Fecha</th><th>Estado</th><th className="num">Total</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/pedidos/${o.id}`}>{o.code}</Link></td>
                  <td>{o.customerName}<br /><span className="s-meta">{o.district}</span></td>
                  <td>{o.items.map((i) => `${i.qty}× ${i.productName} ${i.variantName}`).join(", ")}</td>
                  <td>{o.payment}</td>
                  <td>{fmtDate(o.createdAt)}</td>
                  <td><span className={`pill st-${o.status}`}>{STATUSES.find((x) => x.id === o.status)?.label}</span></td>
                  <td className="num">{money(o.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel">No hay pedidos {valid ? "con ese estado" : "todavía"}.</div>
      )}
    </>
  );
}
