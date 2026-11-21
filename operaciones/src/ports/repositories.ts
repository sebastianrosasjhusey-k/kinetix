/**
 * Contratos de persistencia. Los servicios dependen SOLO de estas interfaces,
 * nunca de una base de datos concreta. Hoy se implementan en memoria
 * (infra/memory); para pasar a línea basta con escribir infra/postgres (u otra)
 * que cumpla los mismos contratos. Todo es asíncrono por esa razón.
 */
import type { Customer } from "../domain/customer.js";
import type { Order, OrderStatus } from "../domain/order.js";
import type { Product, StockMovement, Variant } from "../domain/product.js";

export interface ProductRepository {
  list(): Promise<Product[]>;
  get(id: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
}

export interface VariantRepository {
  list(): Promise<Variant[]>;
  get(sku: string): Promise<Variant | null>;
  save(variant: Variant): Promise<void>;
}

export interface CustomerRepository {
  list(): Promise<Customer[]>;
  get(id: string): Promise<Customer | null>;
  findByPhone(phone: string): Promise<Customer | null>;
  save(customer: Customer): Promise<void>;
}

export interface OrderFilter {
  status?: OrderStatus;
  customerId?: string;
  /** Busca en código, nombre, teléfono y distrito. */
  search?: string;
  from?: string;
  to?: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface OrderRepository {
  list(filter: OrderFilter, page: { limit: number; offset: number }): Promise<Page<Order>>;
  all(): Promise<Order[]>;
  get(id: string): Promise<Order | null>;
  getByCode(code: string): Promise<Order | null>;
  findByIdempotencyKey(key: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
  /** Siguiente número correlativo para el código KX-####. */
  nextNumber(): Promise<number>;
}

export interface StockMovementRepository {
  add(movement: StockMovement): Promise<void>;
  list(filter: { sku?: string; limit: number }): Promise<StockMovement[]>;
}

export interface Repositories {
  products: ProductRepository;
  variants: VariantRepository;
  customers: CustomerRepository;
  orders: OrderRepository;
  movements: StockMovementRepository;
}

/**
 * Ejecuta un bloque como una transacción: o se aplican todos los cambios
 * (pedido + descuento de stock + movimientos) o ninguno.
 */
export interface UnitOfWork {
  run<T>(work: (repos: Repositories) => Promise<T>): Promise<T>;
}

/** Servicios de infraestructura inyectables (facilitan las pruebas). */
export interface Clock {
  now(): Date;
}
export interface IdGenerator {
  next(): string;
}
