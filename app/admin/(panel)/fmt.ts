/** Las fechas se guardan en UTC (SQLite datetime('now')); se muestran en hora de Lima. */
export function fmtDate(utc: string) {
  const d = new Date(utc.replace(" ", "T") + "Z");
  return d.toLocaleString("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
