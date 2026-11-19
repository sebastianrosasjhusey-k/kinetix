"use client";
import { useDb } from "@/lib/store";
import { ProductForm } from "./ProductForm";

export default function Productos() {
  const db = useDb();
  if (!db) return null;
  return (
    <>
      <h1>Productos y stock</h1>
      <p className="adm-sub">Los cambios se ven en la tienda al guardar. Un producto o sabor desactivado deja de mostrarse.</p>
      {db.products.map((p) => (
        <ProductForm key={`${p.id}-${db.seededAt}`} p={p} />
      ))}
    </>
  );
}
