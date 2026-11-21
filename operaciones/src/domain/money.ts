/**
 * El dinero se maneja SIEMPRE en céntimos enteros para evitar errores de
 * redondeo de punto flotante (0.1 + 0.2 !== 0.3). Solo se formatea al mostrar.
 */
export type Cents = number;

export function assertCents(value: number, field = "monto"): Cents {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${field} debe ser un entero de céntimos >= 0`);
  }
  return value;
}

export const formatPEN = (cents: Cents): string => `S/ ${(cents / 100).toFixed(2)}`;
