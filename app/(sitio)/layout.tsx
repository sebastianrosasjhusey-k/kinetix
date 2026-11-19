import Link from "next/link";
import { listProducts } from "@/lib/catalog";
import { CartButton, CartProvider } from "@/components/Cart";
import { Nav } from "@/components/Nav";

export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const products = listProducts();
  return (
    <CartProvider products={products}>
      <header className="site-header">
        <div className="bar pad">
          <Link className="logo" href="/">KINETIX</Link>
          <Nav />
          <CartButton />
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer pad">
        <b>KINETIX NUTRITION</b>
        <span>Kinetix Nutrition SAC · RUC 20615894088 · Oficina comercial en San Borja · Planta en La Molina · Hecho en Perú</span>
        <span>+51 954 966 626 · Instagram @kinetix.nutrition · www.kinetixnutrition.pe</span>
      </footer>
    </CartProvider>
  );
}
