import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError, z } from "zod";
import {
  ConflictError,
  DomainError,
  InsufficientStockError,
  InvalidTransitionError,
  NotFoundError,
  ValidationError,
} from "../domain/errors.js";

/** Formato único de error para toda la API: { error: { code, message, details? } } */
export function errorHandler(err: FastifyError | Error, req: FastifyRequest, reply: FastifyReply) {
  if (err instanceof ZodError) {
    return reply.status(400).send({
      error: { code: "VALIDACION", message: "Datos inválidos", details: z.flattenError(err).fieldErrors },
    });
  }
  if (err instanceof DomainError) {
    const status =
      err instanceof NotFoundError ? 404
      : err instanceof ConflictError ? 409
      : err instanceof InsufficientStockError || err instanceof InvalidTransitionError ? 422
      : err instanceof ValidationError ? 400
      : 400;
    return reply.status(status).send({ error: { code: err.code, message: err.message, details: err.details } });
  }
  const statusCode = "statusCode" in err && typeof err.statusCode === "number" ? err.statusCode : 500;
  if (statusCode >= 500) req.log.error({ err }, "Error no controlado");
  return reply.status(statusCode).send({
    // No se filtran detalles internos al cliente en errores 500.
    error: { code: statusCode >= 500 ? "ERROR_INTERNO" : "SOLICITUD_INVALIDA", message: statusCode >= 500 ? "Error interno" : err.message },
  });
}
