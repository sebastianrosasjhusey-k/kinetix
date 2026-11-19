/** Muestra una fecha ISO en hora de Lima. */
export function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
