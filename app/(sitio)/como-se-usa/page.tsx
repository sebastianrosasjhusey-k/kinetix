import Link from "next/link";
import { ScoopCounter } from "@/components/ScoopCounter";

export const metadata = { title: "Cómo se usa" };

export default function ComoSeUsa() {
  return (
    <>
      <section className="pad dark">
        <h1 className="disp page-title">Así se usa C-PRIX</h1>
        <p className="lead">Tres pasos en el bidón. La cantidad exacta depende de ti y de tu actividad.</p>
      </section>
      <section className="pad">
        <div className="steps">
          <div><b>1</b><h3 className="disp">Mezcla</h3><p>Echa el agua y los scoops en tu bidón. Cada scoop pesa unos 26 g.</p></div>
          <div><b>2</b><h3 className="disp">Agita</h3><p>Los insumos están tamizados al mismo gramaje, así que se disuelve sin dejar grumos.</p></div>
          <div><b>3</b><h3 className="disp">Disfruta</h3><p>Tómalo durante el entrenamiento o la competencia para sostener tu energía.</p></div>
        </div>
        <h2 className="disp" style={{ marginTop: 64 }}>Dos dosis de base</h2>
        <div className="doses">
          <div className="dose"><h3 className="disp">500 ml + 2 scoops</h3><dl><div><dd>50 g</dd><dt>carbohidratos</dt></div><div><dd>400 mg</dd><dt>sodio</dt></div></dl></div>
          <div className="dose k"><h3 className="disp">700 ml + 3 scoops</h3><dl><div><dd>75 g</dd><dt>carbohidratos</dt></div><div><dd>600 mg</dd><dt>sodio</dt></div></dl></div>
        </div>
        <ScoopCounter />
        <div className="tips">
          <p>La cantidad varía según la persona y la actividad. Para un plan a tu medida, usa la <Link href="/calculadora"><b>calculadora</b></Link>.</p>
          <p>Si sudas de forma muy intensa, puedes sumar RAW, los electrolitos en polvo pensados para mezclarse con C-PRIX.</p>
          <p>Guárdalo en un lugar fresco y seco, protegido de la luz solar directa, y mantén el envase cerrado.</p>
          <p>Si tienes indicaciones médicas o restricción de sodio, ajusta la dosis con un profesional.</p>
        </div>
      </section>
    </>
  );
}
