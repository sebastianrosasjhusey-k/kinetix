import { Shop } from "@/components/Shop";

export const metadata = { title: "Tienda" };

export default function Tienda() {
  return (
    <>
      <div className="page-head pad">
        <div>
          <p className="eyebrow">Tienda</p>
          <h1 className="disp page-title">Productos Kinetix</h1>
          <p className="lead">Elige tu sabor y confirma tu pedido. Te contactamos por WhatsApp para coordinar el pago y la entrega.</p>
        </div>
      </div>
      <section className="pad">
        <Shop />
        <div className="trust">
          <div><b>Pago coordinado</b><span>Yape, Plin, transferencia o efectivo contra entrega.</span></div>
          <div><b>Entrega en Lima</b><span>Coordinamos la fecha y la dirección contigo por WhatsApp.</span></div>
          <div><b>Fabricado en Perú</b><span>Producción propia en nuestra planta de La Molina.</span></div>
          <div><b>Precios con IGV</b><span>El total que ves es el total que pagas por los productos.</span></div>
        </div>
      </section>
    </>
  );
}
