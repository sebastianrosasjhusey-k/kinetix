/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { PackImage } from "@/components/PackImage";

const DEPORTES = [
  { slug: "ciclismo", name: "Ciclismo", text: "Salidas largas en ruta, con energía y sodio en el mismo bidón." },
  { slug: "triatlon", name: "Triatlón", text: "Una sola mezcla para el segmento de bici y la transición a la carrera." },
  { slug: "running", name: "Running", text: "Fondos y maratones: ayuda a reponer parte del sodio que pierdes al sudar." },
  { slug: "aguas-abiertas", name: "Aguas abiertas", text: "Natación de larga distancia: prepara tu bidón para cada parada de alimentación." },
  { slug: "funcional", name: "Funcional y HYROX", text: "Carreras de fitness por estaciones, con un esfuerzo largo y continuo." },
];

const BENEFICIOS = [
  ["Energía y sodio en una mezcla", "Carbohidratos y electrolitos en un solo polvo. Sin combinar productos ni hacer cuentas."],
  ["Sal rosada amazónica", "El sodio viene de sal rosada amazónica y no solo de cloruro de sodio."],
  ["Aporte completo por porción", "25 g de carbohidratos y 200 mg de sodio por scoop. Para una persona promedio no hace falta agregar más sodio."],
  ["Sin apelmazamiento", "Insumos tamizados al mismo gramaje: no deja grumos en el fondo de la botella."],
  ["Sabores suaves", "Naranja y Frutos Rojos, que no empalagan ni en dosis altas."],
  ["Formato en polvo", "Lo preparas en tu bidón con la cantidad de agua que prefieras."],
];

export default function Home() {
  return (
    <>
      <section className="hero pad">
        <img src="/images/deportes/triatlon.webp" alt="" fetchPriority="high" />
        <div className="hero-inner">
          <p className="eyebrow">C-PRIX · Carbohidratos + electrolitos</p>
          <h1 className="disp">Energía para ir más lejos.</h1>
          <p>Carbohidratos y sodio en un solo polvo para tu bidón. Formulado y fabricado en Perú para deportistas de endurance.</p>
          <div className="cta">
            <Link className="btn btn-gold" href="/tienda">Comprar C-PRIX</Link>
            <Link className="btn btn-ghost" href="/calculadora">Calcular mi plan</Link>
          </div>
        </div>
      </section>

      <div className="facts pad">
        <div><strong>25 g</strong><span>carbohidratos por scoop</span></div>
        <div><strong>200 mg</strong><span>sodio por scoop</span></div>
        <div><strong>1:0.8</strong><span>maltodextrina : fructosa</span></div>
        <div><strong>34</strong><span>porciones por bolsa de 900 g</span></div>
      </div>

      <section className="pad" id="deportes">
        <div className="sec-head">
          <div>
            <p className="eyebrow">Para tu deporte</p>
            <h2 className="disp">Hecho para el esfuerzo largo</h2>
          </div>
          <p className="lead">C-PRIX se toma durante el entrenamiento y la competencia, en cualquier deporte que pida carbohidratos y electrolitos para sostener el rendimiento.</p>
        </div>
        <div className="sports-grid">
          {DEPORTES.map((d) => (
            <Link key={d.slug} className="sport" href="/calculadora">
              <img src={`/images/deportes/${d.slug}-sm.webp`} alt="" loading="lazy" />
              <div className="sport-body">
                <h3 className="disp">{d.name}</h3>
                <p>{d.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="pad alt">
        <div className="feature">
          <div className="packs">
            <PackImage slug="c-prix" name="C-PRIX" variant="Naranja" />
            <PackImage slug="c-prix" name="C-PRIX" variant="Frutos Rojos" />
          </div>
          <div>
            <p className="eyebrow">El producto</p>
            <h2 className="disp">C-PRIX</h2>
            <p className="lead">Carbohydrates + Electrolytes Drink Mix. Bolsa de 900 g con 34 porciones, en sabores Naranja y Frutos Rojos.</p>
            <div className="benefits">
              {BENEFICIOS.map(([t, d]) => (
                <div key={t}>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              ))}
            </div>
            <div className="cta" style={{ marginTop: 28 }}>
              <Link className="btn btn-red" href="/tienda">Ver en la tienda</Link>
              <Link className="btn btn-ink" href="/como-se-usa">Cómo se usa</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="pad">
        <div className="nutri">
          <div>
            <p className="eyebrow">En la etiqueta</p>
            <h2 className="disp">Información nutricional</h2>
            <p className="lead">Lo que lleva cada scoop de C-PRIX Naranja, tal como figura en el empaque.</p>
            <dl className="spec" style={{ marginTop: 32 }}>
              <div>
                <dt>Ingredientes</dt>
                <dd>Maltodextrina, fructosa, saborizante idéntico al natural de naranja, sal rosada amazónica y ácido cítrico (SIN 330).</dd>
              </div>
              <div>
                <dt>Conservación</dt>
                <dd>En un lugar fresco y seco, protegido de la luz solar directa. Mantener el envase cerrado.</dd>
              </div>
              <div>
                <dt>Advertencias</dt>
                <dd className="seals" style={{ marginTop: 6 }}>
                  <span className="seal">Alto en azúcar</span>
                  <span className="seal">Alto en sodio</span>
                </dd>
                <p className="note" style={{ marginTop: 10 }}>Advertencias obligatorias en Perú. Si tienes una condición médica o restricción de sodio, consulta a un profesional antes de usarlo.</p>
              </div>
            </dl>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="label-table">
              <caption>Porción: 1 scoop (26 g aprox.) · 34 porciones por envase</caption>
              <thead>
                <tr><th>Nutriente</th><th>Por porción</th><th>% IR</th></tr>
              </thead>
              <tbody>
                <tr><td>Calorías</td><td>98</td><td></td></tr>
                <tr><td>Carbohidratos totales</td><td>25 g</td><td>9%</td></tr>
                <tr className="sub"><td>Fibra alimentaria</td><td>0 g</td><td>0%</td></tr>
                <tr className="sub"><td>Azúcares totales</td><td>11 g</td><td></td></tr>
                <tr className="sub"><td>Azúcares agregados</td><td>11 g</td><td>22%</td></tr>
                <tr><td>Sodio</td><td>200 mg</td><td>10%</td></tr>
                <tr><td>Cloruro</td><td>310 mg</td><td>13%</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="pad alt">
        <div className="sec-head">
          <div>
            <p className="eyebrow">La línea Kinetix</p>
            <h2 className="disp">Tres productos, un sistema</h2>
          </div>
          <p className="lead">C-PRIX aporta la energía. HYD-PRIX y RAW completan la hidratación para el día a día o para los que sudan más.</p>
        </div>
        <div className="line3">
          <Link className="line-card" href="/tienda">
            <div className="ph"><PackImage slug="c-prix" name="C-PRIX" variant="Naranja" /></div>
            <div className="tx"><h3 className="disp">C-PRIX</h3><p>Carbohidratos + electrolitos. 900 g, 34 porciones.</p><span className="more">Ver producto</span></div>
          </Link>
          <Link className="line-card" href="/tienda">
            <div className="ph"><PackImage slug="hyd-prix" name="HYD-PRIX" variant="Maracumango" /></div>
            <div className="tx"><h3 className="disp">HYD-PRIX</h3><p>Electrolitos con sabor natural, sin colorantes. 100 g, 33 porciones.</p><span className="more">Ver producto</span></div>
          </Link>
          <Link className="line-card" href="/tienda">
            <div className="ph"><PackImage slug="raw" name="RAW" variant="Sin sabor" /></div>
            <div className="tx"><h3 className="disp">RAW</h3><p>Electrolitos sin sabor, para mezclar con C-PRIX. 100 g, 33 porciones.</p><span className="more">Ver producto</span></div>
          </Link>
        </div>
      </section>

      <section className="pad dark">
        <div className="company">
          <div>
            <p className="eyebrow">Quiénes somos</p>
            <h2 className="disp">Kinetix Nutrition</h2>
            <p className="lead">Desarrollamos y fabricamos suplementos para deportes de endurance en nuestra planta de Lima, con un equipo dedicado a la investigación de producto.</p>
            <div className="team">
              <div><b>Gianfranco Salinas</b><span>CEO · Innovación e investigación</span></div>
              <div><b>Carlos</b><span>Producción y control de calidad</span></div>
              <div><b>Sebastián Rosas</b><span>Comercial y distribución</span></div>
            </div>
          </div>
          <dl className="company-facts">
            <div><dt>Razón social</dt><dd>Kinetix Nutrition SAC</dd></div>
            <div><dt>RUC</dt><dd>20615894088</dd></div>
            <div><dt>Fabricación</dt><dd>Planta propia en La Molina, Lima</dd></div>
            <div><dt>Oficina comercial</dt><dd>San Borja, Lima</dd></div>
            <div><dt>Origen</dt><dd>Hecho en Perú</dd></div>
          </dl>
        </div>
      </section>

      <section className="photo-band pad">
        <img src="/images/deportes/running.webp" alt="" loading="lazy" />
        <div>
          <p className="eyebrow">Tu próxima salida</p>
          <h2 className="disp">Calcula cuánto llevar en cada bidón</h2>
          <p>La calculadora estima líquido, sodio y carbohidratos por hora según tu peso, tu sudoración y el clima del día.</p>
          <div className="cta">
            <Link className="btn btn-gold" href="/calculadora">Usar la calculadora</Link>
            <Link className="btn btn-ghost" href="/tienda">Ir a la tienda</Link>
          </div>
        </div>
      </section>
    </>
  );
}
