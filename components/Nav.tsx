"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Beneficios" },
  { href: "/como-se-usa", label: "Cómo se usa" },
  { href: "/tienda", label: "Tienda", shop: true },
  { href: "/calculadora", label: "Calculadora" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Principal">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={l.shop ? "nav-shop" : undefined} aria-current={path === l.href ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
