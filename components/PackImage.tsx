/* eslint-disable @next/next/no-img-element */
import { packImage } from "@/lib/types";

/** Frente real del empaque (exportado del archivo de packaging). */
export function PackImage({ slug, name, variant, className }: { slug: string; name: string; variant: string; className?: string }) {
  return <img className={className} src={packImage(slug, variant)} alt={`Empaque de ${name} ${variant}`} loading="lazy" decoding="async" />;
}
