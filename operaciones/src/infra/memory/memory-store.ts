import type { Customer } from "../../domain/customer.js";
import type { Order } from "../../domain/order.js";
import type { Product, StockMovement, Variant } from "../../domain/product.js";
import type { OrderFilter, Page, Repositories, UnitOfWork } from "../../ports/repositories.js";

interface State {
  products: Map<string, Product>;
  variants: Map<string, Variant>;
  customers: Map<string, Customer>;
  orders: Map<string, Order>;
  movements: StockMovement[];
  orderSeq: number;
}

const emptyState = (): State => ({
  products: new Map(),
  variants: new Map(),
  customers: new Map(),
  orders: new Map(),
  movements: [],
  orderSeq: 1000,
});

/** Copias defensivas: quien lee no puede mutar el estado interno por accidente. */
const copy = <T>(v: T): T => structuredClone(v);

/**
 * Almacenamiento en memoria del proceso. Los datos se pierden al reiniciar
 * (es intencional en esta etapa). Las transacciones se serializan con una cola
 * y, si fallan, se revierte al estado previo, igual que haría una base de datos.
 */
export class MemoryStore implements UnitOfWork {
  private state: State = emptyState();
  private queue: Promise<unknown> = Promise.resolve();
  readonly repos: Repositories;

  constructor() {
    const s = () => this.state;
    this.repos = {
      products: {
        list: async () => [...s().products.values()].map(copy),
        get: async (id) => copy(s().products.get(id) ?? null),
        save: async (p) => void s().products.set(p.id, copy(p)),
      },
      variants: {
        list: async () => [...s().variants.values()].map(copy),
        get: async (sku) => copy(s().variants.get(sku) ?? null),
        save: async (v) => void s().variants.set(v.sku, copy(v)),
      },
      customers: {
        list: async () => [...s().customers.values()].map(copy),
        get: async (id) => copy(s().customers.get(id) ?? null),
        findByPhone: async (phone) => copy([...s().customers.values()].find((c) => c.phone === phone) ?? null),
        save: async (c) => void s().customers.set(c.id, copy(c)),
      },
      orders: {
        all: async () => [...s().orders.values()].map(copy),
        get: async (id) => copy(s().orders.get(id) ?? null),
        getByCode: async (code) =>
          copy([...s().orders.values()].find((o) => o.code.toUpperCase() === code.toUpperCase()) ?? null),
        findByIdempotencyKey: async (key) =>
          copy([...s().orders.values()].find((o) => o.idempotencyKey === key) ?? null),
        save: async (o) => void s().orders.set(o.id, copy(o)),
        nextNumber: async () => ++s().orderSeq,
        list: async (filter, page) => paginate(filterOrders([...s().orders.values()], filter), page),
      },
      movements: {
        add: async (m) => void s().movements.push(copy(m)),
        list: async ({ sku, limit }) =>
          s()
            .movements.filter((m) => !sku || m.sku === sku)
            .slice(-limit)
            .reverse()
            .map(copy),
      },
    };
  }

  run<T>(work: (repos: Repositories) => Promise<T>): Promise<T> {
    const exec = async () => {
      const snapshot = structuredClone(this.state);
      try {
        return await work(this.repos);
      } catch (err) {
        this.state = snapshot; // rollback
        throw err;
      }
    };
    const result = this.queue.then(exec, exec);
    this.queue = result.catch(() => undefined);
    return result;
  }
}

function filterOrders(orders: Order[], f: OrderFilter): Order[] {
  const q = f.search?.trim().toLowerCase();
  return orders
    .filter((o) => !f.status || o.status === f.status)
    .filter((o) => !f.customerId || o.customerId === f.customerId)
    .filter((o) => !f.from || o.createdAt >= f.from)
    .filter((o) => !f.to || o.createdAt <= f.to)
    .filter(
      (o) =>
        !q ||
        [o.code, o.customerName, o.phone, o.district].some((field) => field.toLowerCase().includes(q)),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.code.localeCompare(a.code, undefined, { numeric: true }));
}

function paginate(items: Order[], { limit, offset }: { limit: number; offset: number }): Page<Order> {
  return { items: items.slice(offset, offset + limit).map(copy), total: items.length, limit, offset };
}
