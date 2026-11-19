import Link from "next/link";
import { listProducts } from "@/lib/catalog";
import { CartButton, CartProvider } from "@/components/Cart";
import { Nav } from "@/components/Nav";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const products = listProducts();
  return (
    <CartProvider products={products}>
      <header className="site-header">
        <div className="bar pad">
          <Link className="logo" href="/" aria-label="Kinetix Nutrition, inicio">
            KINETIX<small>NUTRITION</small>
          </Link>
          <Nav />
          <CartButton />
        </div>
      </header>
      <main>{children}</main>
      <SiteFooter />
    </CartProvider>
  );
}
