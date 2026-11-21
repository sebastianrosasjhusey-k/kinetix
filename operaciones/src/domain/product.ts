import type { Cents } from "./money.js";

export interface Product {
  id: string;
  name: string;
  description: string;
  size: string;
  priceCents: Cents;
  active: boolean;
}

/** Unidad vendible con stock propio (producto + sabor). */
export interface Variant {
  sku: string;
  productId: string;
  flavor: string;
  stock: number;
  /** Umbral para alertar reposición. */
  reorderLevel: number;
  active: boolean;
}

export type StockMovementType = "entrada" | "salida_pedido" | "liberacion_pedido" | "ajuste";

/** Libro de movimientos: todo cambio de stock queda registrado y es auditable. */
export interface StockMovement {
  id: string;
  sku: string;
  type: StockMovementType;
  /** Positivo suma, negativo resta. */
  quantity: number;
  stockAfter: number;
  reason: string;
  orderCode: string | null;
  actor: string;
  at: string;
}
