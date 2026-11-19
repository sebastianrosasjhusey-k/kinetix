"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDb } from "@/lib/store";
import { money, WHATSAPP } from "@/lib/types";

export default function PedidoPage() {
  return (
    <Suspense fallback={<section className="pad"><p className="lead">Cargando tu pedido…</p></section>}>
      <Pedido />
    </Suspense>
  );
}

function Pedido() {
  const q = useSearchParams();
  const db = useDb();
  if (!db) return <section className="pad"><p className="lead">Cargando tu pedido…</p></section>;
  const o = db.orders.find((x) => x.code === q.get("c") && x.key === q.get("k"));
  if (!o)
    return (
      <section className="pad">
        <h1 className="disp page-title">Pedido no encontrado</h1>
        <p className="lead">Revisa el enlace o vuelve a la <Link href="/tienda">tienda</Link>. En esta demostración, los pedidos solo se ven en el navegador donde se hicieron.</p>
      </section>
    );

  const msg = [
    `Hola Kinetix, acabo de hacer el pedido ${o.code}.`,
    ...o.items.map((i) => `• ${i.qty} × ${i.productName} ${i.variantName}`),
    `Total: ${money(o.totalCents)}`,
    `Pago: ${o.payment}`,
  ].join("\n");

  return (
    <section className="pad">
      <h1 className="disp page-title">Pedido recibido</h1>
      <p className="lead">
        Gracias, {o.customerName.split(" ")[0]}. Tu número de pedido es <b>{o.code}</b>. Te escribiremos al {o.phone} para coordinar el pago y la entrega.
      </p>
      <div className="receipt">
        <table>
          <tbody>
            {o.items.map((i, n) => (
              <tr key={n}>
                <td>{i.qty} × {i.productName} {i.variantName}</td>
                <td>{money(i.unitCents * i.qty)}</td>
              </tr>
            ))}
            <tr>
              <td><b>Total</b></td>
              <td><b>{money(o.totalCents)}</b></td>
            </tr>
          </tbody>
        </table>
        <p className="s-meta">Pago: {o.payment} · Entrega en {o.district}</p>
        <div className="cta" style={{ marginTop: 20 }}>
          <a className="wa" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener">
            Avisar por WhatsApp
          </a>
          <Link className="btn btn-ink" href="/tienda">Seguir comprando</Link>
        </div>
        <p className="fine" style={{ marginTop: 14 }}>
          Para ver este pedido del lado del negocio, entra al <Link href="/admin">panel de administración</Link> (usuario admin@kinetix.pe, contraseña kinetix2026).
        </p>
      </div>
    </section>
  );
}
