import { CalcFrame } from "@/components/CalcFrame";

export const metadata = { title: "Calculadora" };

export default function Calculadora() {
  return (
    <>
      <section className="pad dark" style={{ paddingBottom: 36 }}>
        <h1 className="disp page-title">Calcula tu plan</h1>
        <p className="lead">Cuánto líquido, sodio y carbohidrato por hora según tu peso, tu sudor y el clima, traducido a scoops en cada bidón. Ya trae cargados los valores de la etiqueta de C-PRIX y RAW.</p>
      </section>
      <CalcFrame />
    </>
  );
}
