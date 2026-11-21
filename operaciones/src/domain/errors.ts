/**
 * Errores de negocio. La capa HTTP los traduce a códigos de estado; el dominio
 * no sabe nada de HTTP.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  constructor(message: string, readonly details?: unknown) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  readonly code = "NO_ENCONTRADO";
}

export class ValidationError extends DomainError {
  readonly code = "VALIDACION";
}

/** El recurso cambió desde que el cliente lo leyó (control de concurrencia optimista). */
export class ConflictError extends DomainError {
  readonly code = "CONFLICTO";
}

export class InsufficientStockError extends DomainError {
  readonly code = "STOCK_INSUFICIENTE";
}

export class InvalidTransitionError extends DomainError {
  readonly code = "TRANSICION_INVALIDA";
}
