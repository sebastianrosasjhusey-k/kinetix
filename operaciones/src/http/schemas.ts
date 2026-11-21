import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_METHODS, SALES_CHANNELS } from "../domain/order.js";

const text = (max: number) => z.string().trim().min(1, "Requerido").max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));
const cents = z.number().int().min(0).max(100_000_00);

export const createOrderBody = z.object({
  customer: z.object({
    name: text(120),
    phone: z.string().trim().regex(/^[+\d\s()-]{7,20}$/, "Teléfono inválido"),
    email: z.union([z.email("Correo inválido"), z.literal("")]).nullish().transform((v) => v || null),
  }),
  address: text(200),
  district: text(80),
  reference: optionalText(200),
  channel: z.enum(SALES_CHANNELS).default("whatsapp"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  items: z
    .array(z.object({ sku: text(40), quantity: z.number().int().min(1).max(500) }))
    .min(1, "Agrega al menos un producto")
    .max(50),
  discountCents: cents.default(0),
  shippingCents: cents.default(0),
  notes: optionalText(1000),
});

export const changeStatusBody = z.object({
  to: z.enum(ORDER_STATUSES),
  expectedVersion: z.number().int().min(1),
  note: optionalText(500),
});

export const updateOrderBody = z.object({
  expectedVersion: z.number().int().min(1),
  address: text(200).optional(),
  district: text(80).optional(),
  reference: optionalText(200).optional(),
  notes: optionalText(1000).optional(),
});

export const listOrdersQuery = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  search: z.string().trim().max(100).optional(),
  customerId: z.string().max(64).optional(),
  from: z.iso.datetime({ offset: true }).or(z.iso.date()).optional(),
  to: z.iso.datetime({ offset: true }).or(z.iso.date()).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const rangeQuery = listOrdersQuery.pick({ from: true, to: true });

export const updateProductBody = z
  .object({ priceCents: cents.optional(), active: z.boolean().optional(), description: text(500).optional() })
  .refine((o) => Object.keys(o).length > 0, "Nada que actualizar");

export const updateVariantBody = z
  .object({ reorderLevel: z.number().int().min(0).max(10_000).optional(), active: z.boolean().optional() })
  .refine((o) => Object.keys(o).length > 0, "Nada que actualizar");

export const stockMovementBody = z.object({
  type: z.enum(["entrada", "ajuste"]),
  quantity: z.number().int().min(-10_000).max(10_000).refine((n) => n !== 0, "No puede ser 0"),
  reason: text(200),
});

export const idempotencyKeyHeader = z.string().trim().min(8).max(100).optional();
