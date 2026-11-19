import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByCode } from "@/lib/catalog";
import { money, WHATSAPP } from "@/lib/types";

export const metadata = { title: "Pedido recibido" };

export default async function Pedido({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ k?: string }> }) {
  const { code } = await params;
  const { k } = await searchParams;
  const o = k ? getOrderByCode(code, k) : null;
  if (!o) notFound();

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
        <p className="fine" style={{ marginTop: 14 }}>Si pagas con Yape, Plin o transferencia, envíanos la constancia por WhatsApp con tu número de pedido.</p>
      </div>
    </section>
  );
}
