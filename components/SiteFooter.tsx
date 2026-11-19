import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer pad">
      <div className="foot-grid">
        <div className="foot-brand">
          <div className="logo">KINETIX<small>NUTRITION</small></div>
          <p>Carbohidratos y electrolitos en polvo para deportes de endurance. Desarrollados y fabricados en Perú.</p>
        </div>
        <div>
          <h4>Productos</h4>
          <ul>
            <li><Link href="/tienda">C-PRIX</Link></li>
            <li><Link href="/tienda">HYD-PRIX</Link></li>
            <li><Link href="/tienda">RAW</Link></li>
          </ul>
        </div>
        <div>
          <h4>Recursos</h4>
          <ul>
            <li><Link href="/como-se-usa">Cómo se usa</Link></li>
            <li><Link href="/calculadora">Calculadora de plan</Link></li>
            <li><Link href="/#deportes">Para tu deporte</Link></li>
          </ul>
        </div>
        <div>
          <h4>Contacto</h4>
          <ul>
            <li>+51 954 966 626</li>
            <li>Instagram @kinetix.nutrition</li>
            <li>www.kinetixnutrition.pe</li>
            <li>Oficina comercial: San Borja, Lima</li>
          </ul>
        </div>
      </div>
      <div className="foot-legal">
        <span>© {new Date().getFullYear()} Kinetix Nutrition SAC · RUC 20615894088</span>
        <span>Planta de fabricación en La Molina · Hecho en Perú</span>
      </div>
    </footer>
  );
}
