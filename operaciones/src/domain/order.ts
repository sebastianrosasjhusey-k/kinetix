import type { Cents } from "./money.js";
import { InvalidTransitionError } from "./errors.js";

export const ORDER_STATUSES = ["nuevo", "confirmado", "pagado", "enviado", "entregado", "cancelado"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["yape_plin", "transferencia", "efectivo_contra_entrega"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const SALES_CHANNELS = ["web", "whatsapp", "instagram", "presencial", "otro"] as const;
export type SalesChannel = (typeof SALES_CHANNELS)[number];

/**
 * Máquina de estados del pedido. Es la única fuente de verdad sobre qué
 * cambios están permitidos; la UI la consulta en vez de duplicar reglas.
 * El contra entrega puede pasar de "enviado" a "entregado" sin pasar por "pagado".
 */
export const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  nuevo: ["confirmado", "cancelado"],
  confirmado: ["pagado", "enviado", "cancelado"],
  pagado: ["enviado", "cancelado"],
  enviado: ["entregado", "cancelado"],
  entregado: [],
  cancelado: [],
};

export function allowedTransitions(order: Pick<Order, "status" | "paymentMethod">): OrderStatus[] {
  return TRANSITIONS[order.status].filter((to) => {
    // Solo el contra entrega puede enviarse sin estar pagado.
    if (order.status === "confirmado" && to === "enviado") return order.paymentMethod === "efectivo_contra_entrega";
    return true;
  });
}

export function assertTransition(order: Pick<Order, "status" | "paymentMethod">, to: OrderStatus): void {
  if (!allowedTransitions(order).includes(to)) {
    throw new InvalidTransitionError(`No se puede pasar un pedido de "${order.status}" a "${to}"`, {
      from: order.status,
      to,
      allowed: allowedTransitions(order),
    });
  }
}

export interface OrderLine {
  sku: string;
  productName: string;
  flavor: string;
  /** Precio congelado al momento de la venta: cambios de precio no alteran pedidos pasados. */
  unitPriceCents: Cents;
  quantity: number;
  lineTotalCents: Cents;
}

export interface StatusChange {
  from: OrderStatus | null;
  to: OrderStatus;
  at: string;
  actor: string;
  note: string | null;
}

export interface Order {
  id: string;
  /** Código legible para el cliente, p. ej. KX-1042. */
  code: string;
  customerId: string;
  customerName: string;
  phone: string;
  email: string | null;
  address: string;
  district: string;
  reference: string | null;
  channel: SalesChannel;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  lines: OrderLine[];
  subtotalCents: Cents;
  discountCents: Cents;
  shippingCents: Cents;
  totalCents: Cents;
  notes: string | null;
  history: StatusChange[];
  createdAt: string;
  updatedAt: string;
  /** Clave enviada por el cliente para que reintentar un POST no duplique el pedido. */
  idempotencyKey: string | null;
  /** Se incrementa en cada cambio; el cliente lo envía para detectar ediciones simultáneas. */
  version: number;
}

/** Estados que cuentan como venta realizada para reportes. */
export const isRevenue = (s: OrderStatus) => s === "pagado" || s === "enviado" || s === "entregado";
