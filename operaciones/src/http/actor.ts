import type { FastifyRequest } from "fastify";

/**
 * Quién hace el cambio (queda en el historial). En local se toma del
 * encabezado X-Operador; al pasar a línea se reemplaza por el usuario autenticado.
 */
export function actorOf(req: FastifyRequest): string {
  const raw = req.headers["x-operador"];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return value ? decodeURIComponent(value).slice(0, 60) : "anónimo";
}
