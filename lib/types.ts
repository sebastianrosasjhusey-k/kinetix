export type Variant = {
  id: number;
  name: string;
  colorA: string;
  colorB: string;
  stock: number;
  active: boolean;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  size: string;
  priceCents: number;
  compareCents: number | null;
  warning: string | null;
  style: "cream" | "dark" | "light";
  active: boolean;
  variants: Variant[];
};

export const money = (cents: number) => "S/ " + (cents / 100).toFixed(2);

export const WHATSAPP = "51954966626";

/** Imagen real del empaque según producto y sabor (public/images/productos). */
export function packImage(slug: string, variant: string): string {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  return `/images/productos/${norm(slug)}-${norm(variant)}.webp`;
}
