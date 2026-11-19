import { listProducts } from "@/lib/catalog";
import { ProductForm } from "./ProductForm";

export const metadata = { title: "Productos y stock" };

export default function Productos() {
  const products = listProducts({ includeInactive: true });
  return (
    <>
      <h1>Productos y stock</h1>
      <p className="adm-sub">Los cambios se ven en la tienda al guardar. Un producto o sabor desactivado deja de mostrarse.</p>
      {products.map((p) => (
        <ProductForm key={p.id} p={p} />
      ))}
    </>
  );
}
