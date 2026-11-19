import { CalcFrame } from "@/components/CalcFrame";

export const metadata = { title: "Calculadora" };

export default function Calculadora() {
  return (
    <>
      <div className="page-head pad">
        <div>
          <p className="eyebrow">Herramienta</p>
          <h1 className="disp page-title">Calcula tu plan</h1>
          <p className="lead">Cuánto líquido, sodio y carbohidrato por hora según tu peso, tu sudoración y el clima, traducido a scoops en cada bidón. Trae cargados los valores de la etiqueta de C-PRIX y RAW.</p>
        </div>
      </div>
      <CalcFrame />
    </>
  );
}
