export interface Customer {
  id: string;
  name: string;
  /** Normalizado a solo dígitos: es la clave para reconocer clientes recurrentes. */
  phone: string;
  email: string | null;
  createdAt: string;
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Números peruanos: quitar el prefijo de país si viene incluido.
  return digits.length === 11 && digits.startsWith("51") ? digits.slice(2) : digits;
}
