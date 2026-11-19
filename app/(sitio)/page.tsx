import Link from "next/link";
import { Pouch } from "@/components/Pouch";

const BENEFICIOS = [
  ["Energía y sodio en una mezcla", "Un solo polvo con carbohidratos y electrolitos, listo para entrenamientos y competencias. Sin combinar productos ni hacer cuentas."],
  ["Sodio de sal rosada amazónica", "No es solo cloruro de sodio: C-PRIX usa sal rosada amazónica, con mayor valor nutricional."],
  ["Aporte completo por porción", "Cada scoop trae 25 g de carbohidratos y 200 mg de sodio. Con 2 scoops son 50 g y 400 mg. Para una persona promedio no hace falta agregar más sodio."],
  ["Sin apelmazamiento", "Los insumos están tamizados al mismo gramaje, así que la mezcla con agua no deja grumos en el fondo de la botella."],
  ["Sabores suaves", "Naranja y Frutos Rojos. No empalagan, ni siquiera en dosis altas."],
  ["Precio competitivo", "Acorde al mercado. La bolsa de 900 g rinde 34 porciones, con precio de lanzamiento de S/ 95."],
  ["Formato en polvo", "Se prepara en el bidón con la cantidad de agua que prefieras. Tú decides cuánto llevas."],
];

export default function Home() {
  return (
    <>
      <section className="dark pad hero">
        <div>
          <h1 className="disp">Energía para ir más lejos.</h1>
          <p>C-PRIX reúne carbohidratos y sodio en un solo polvo que se mezcla en tu bidón. Hecho en Perú para correr, nadar y pedalear sin armar combinaciones por tu cuenta.</p>
          <div className="cta">
            <Link className="btn btn-gold" href="/tienda">Comprar C-PRIX</Link>
            <Link className="btn btn-ghost" href="/calculadora">Calcula tu plan</Link>
          </div>
        </div>
        <div className="pouches" aria-hidden="true">
          <Pouch name="C-PRIX" variant="Naranja" style="cream" colorA="EC6B3B" colorB="F0C020" label={false} />
          <Pouch name="C-PRIX" variant="Frutos Rojos" style="cream" colorA="B41B6E" colorB="EB5FA3" label={false} />
        </div>
      </section>

      <section className="stats pad">
        <div><strong>25 g</strong><span>de carbohidratos por scoop</span></div>
        <div><strong>200 mg</strong><span>de sodio por scoop</span></div>
        <div><strong>1:0.8</strong><span>maltodextrina + fructosa</span></div>
        <div><strong>34</strong><span>porciones por bolsa de 900 g</span></div>
      </section>

      <section className="pad">
        <h2 className="disp">Todo lo que tiene tu bidón</h2>
        <p className="lead">Siete razones por las que C-PRIX se mezcla, se toma y se repite.</p>
        <div className="ben">
          {BENEFICIOS.map(([t, d]) => (
            <div key={t}>
              <h3 className="disp">{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pad dark">
        <div className="two">
          <div>
            <h2 className="disp">Hecho por un equipo especializado</h2>
            <p className="lead">Desarrollado por Kinetix, con un equipo dedicado a la investigación de producto. Fabricado y controlado en nuestra planta de La Molina.</p>
          </div>
          <div>
            <h2 className="disp" style={{ fontSize: "clamp(30px,4.5vw,46px)" }}>Para quién es</h2>
            <p className="lead">Para deportes de endurance y cualquier otro que requiera carbohidratos y electrolitos para mantener el rendimiento. Se usa durante el entrenamiento y la competencia.</p>
            <div className="sports"><span>Running</span><span>Triatlón</span><span>Natación</span><span>Aguas abiertas</span></div>
          </div>
        </div>
      </section>

      <section className="pad">
        <h2 className="disp">Una línea que se complementa</h2>
        <div className="line3">
          <div><h3 className="disp">C-PRIX</h3><p>Carbohidratos + electrolitos. Naranja y Frutos Rojos. 900 g, 34 porciones.</p></div>
          <div><h3 className="disp">HYD-PRIX</h3><p>Electrolitos en polvo con sabor natural, Maracumango y Limón. Sin colorantes. 100 g, 33 porciones.</p></div>
          <div><h3 className="disp">RAW</h3><p>Electrolitos sin sabor, ideales para mezclar con C-PRIX si sudas muy intensamente. 100 g, 33 porciones.</p></div>
        </div>
        <p className="note">C-PRIX lleva las advertencias “Alto en azúcar” y “Alto en sodio” que exige la normativa peruana. Si tienes una condición médica o una restricción de sodio, consulta a un profesional antes de usarlo.</p>
      </section>

      <section className="pad dark">
        <h2 className="disp">Prepara tu próxima salida</h2>
        <div className="cta" style={{ marginTop: 24 }}>
          <Link className="btn btn-gold" href="/tienda">Comprar C-PRIX</Link>
          <Link className="btn btn-ghost" href="/como-se-usa">Ver cómo se usa</Link>
        </div>
      </section>
    </>
  );
}
