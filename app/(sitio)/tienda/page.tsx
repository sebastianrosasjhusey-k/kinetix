import { Shop } from "@/components/Shop";

export const metadata = { title: "Tienda" };

export default function Tienda() {
  return (
    <>
      <section className="pad dark" style={{ paddingBottom: 36 }}>
        <h1 className="disp page-title">Tienda</h1>
        <p className="lead">Elige tu sabor, agrégalo y confirma tu pedido. Te escribimos por WhatsApp para coordinar el pago y la entrega.</p>
      </section>
      <section className="pad">
        <Shop />
      </section>
    </>
  );
}
