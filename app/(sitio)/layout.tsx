import Link from "next/link";
import { CartButton, CartProvider } from "@/components/Cart";
import { Nav } from "@/components/Nav";
import { SiteFooter } from "@/components/SiteFooter";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <header className="site-header">
        <div className="bar pad">
          <Link className="logo" href="/" aria-label="Kinetix Nutrition, inicio">
            KINETIX<small>NUTRITION</small>
          </Link>
          <Nav />
          <CartButton />
        </div>
      </header>
      <p className="demo-bar pad">Versión de demostración: los pedidos se guardan solo en este navegador y no se cobran.</p>
      <main>{children}</main>
      <SiteFooter />
    </CartProvider>
  );
}
