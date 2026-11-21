import type { Clock, IdGenerator, Repositories, UnitOfWork } from "../ports/repositories.js";

/** Dependencias compartidas por todos los servicios (inyección de dependencias). */
export interface ServiceContext {
  uow: UnitOfWork;
  /** Repositorios para lecturas fuera de transacción. */
  repos: Repositories;
  clock: Clock;
  ids: IdGenerator;
}
