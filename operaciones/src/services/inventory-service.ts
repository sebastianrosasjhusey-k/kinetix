import { NotFoundError, ValidationError } from "../domain/errors.js";
import { assertCents, type Cents } from "../domain/money.js";
import type { Product, StockMovement, StockMovementType, Variant } from "../domain/product.js";
import type { Repositories } from "../ports/repositories.js";
import type { ServiceContext } from "./context.js";

export interface CatalogItem extends Product {
  variants: (Variant & { lowStock: boolean })[];
}

export class InventoryService {
  constructor(private readonly ctx: ServiceContext) {}

  async catalog(): Promise<CatalogItem[]> {
    const [products, variants] = await Promise.all([this.ctx.repos.products.list(), this.ctx.repos.variants.list()]);
    return products
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => ({
        ...p,
        variants: variants
          .filter((v) => v.productId === p.id)
          .sort((a, b) => a.sku.localeCompare(b.sku))
          .map((v) => ({ ...v, lowStock: v.active && v.stock <= v.reorderLevel })),
      }));
  }

  async updateProduct(id: string, patch: { priceCents?: Cents; active?: boolean; description?: string }): Promise<Product> {
    return this.ctx.uow.run(async (r) => {
      const product = await r.products.get(id);
      if (!product) throw new NotFoundError(`Producto ${id} no existe`);
      if (patch.priceCents !== undefined) product.priceCents = assertCents(patch.priceCents, "precio");
      if (patch.active !== undefined) product.active = patch.active;
      if (patch.description !== undefined) product.description = patch.description;
      await r.products.save(product);
      return product;
    });
  }

  async updateVariant(sku: string, patch: { reorderLevel?: number; active?: boolean }): Promise<Variant> {
    return this.ctx.uow.run(async (r) => {
      const variant = await r.variants.get(sku);
      if (!variant) throw new NotFoundError(`SKU ${sku} no existe`);
      if (patch.reorderLevel !== undefined) variant.reorderLevel = patch.reorderLevel;
      if (patch.active !== undefined) variant.active = patch.active;
      await r.variants.save(variant);
      return variant;
    });
  }

  /** Ingreso de mercadería (cantidad > 0) o ajuste por conteo físico (cantidad +/-). */
  async moveStock(input: {
    sku: string;
    type: Extract<StockMovementType, "entrada" | "ajuste">;
    quantity: number;
    reason: string;
    actor: string;
  }): Promise<Variant> {
    if (!Number.isInteger(input.quantity) || input.quantity === 0) throw new ValidationError("La cantidad debe ser un entero distinto de 0");
    if (input.type === "entrada" && input.quantity < 0) throw new ValidationError("Una entrada de mercadería debe ser positiva");
    return this.ctx.uow.run(async (r) => {
      const variant = await r.variants.get(input.sku);
      if (!variant) throw new NotFoundError(`SKU ${input.sku} no existe`);
      if (variant.stock + input.quantity < 0)
        throw new ValidationError(`El stock de ${input.sku} no puede quedar negativo (actual: ${variant.stock})`);
      await applyStock(this.ctx, r, variant, input.quantity, input.type, input.reason, null, input.actor);
      return variant;
    });
  }

  movements(sku?: string, limit = 100): Promise<StockMovement[]> {
    return this.ctx.repos.movements.list({ sku, limit });
  }
}

/** Único punto que modifica stock: siempre deja un movimiento en el libro. */
export async function applyStock(
  ctx: ServiceContext,
  r: Repositories,
  variant: Variant,
  quantity: number,
  type: StockMovementType,
  reason: string,
  orderCode: string | null,
  actor: string,
): Promise<void> {
  variant.stock += quantity;
  await r.variants.save(variant);
  await r.movements.add({
    id: ctx.ids.next(),
    sku: variant.sku,
    type,
    quantity,
    stockAfter: variant.stock,
    reason,
    orderCode,
    actor,
    at: ctx.clock.now().toISOString(),
  });
}
