import Link from "next/link";
import { CartButton, CartProvider } from "@/components/Cart";
import { Nav } from "@/components/Nav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <header className="site-header">
        <div className="bar pad">
          <Link className="logo" href="/">KINETIX</Link>
          <Nav />
          <CartButton />
        </div>
      </header>
      <p className="demo-bar pad">Versión de demostración: los pedidos se guardan solo en este navegador y no se cobran.</p>
      <main>{children}</main>
      <footer className="site-footer pad">
        <b>KINETIX NUTRITION</b>
        <span>Kinetix Nutrition SAC · RUC 20615894088 · Oficina comercial en San Borja · Planta en La Molina · Hecho en Perú</span>
        <span>+51 954 966 626 · Instagram @kinetix.nutrition · www.kinetixnutrition.pe</span>
      </footer>
    </CartProvider>
  );
}
