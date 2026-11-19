import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, hashPassword, verifyPassword } from "./db";

const COOKIE = "kx_session";
const DAYS = 7;

export type User = { id: number; email: string; name: string };

export async function login(email: string, password: string): Promise<boolean> {
  const d = db();
  const u = d.prepare("SELECT id, pass_hash FROM users WHERE email=?").get(email.trim().toLowerCase()) as
    | { id: number; pass_hash: string }
    | undefined;
  // Se verifica siempre una contraseña para no revelar si el correo existe por el tiempo de respuesta.
  const ok = verifyPassword(password, u?.pass_hash ?? "00:00");
  if (!u || !ok) return false;
  const token = crypto.randomBytes(32).toString("hex");
  d.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
  d.prepare(`INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,datetime('now','+${DAYS} days'))`).run(token, u.id);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DAYS * 86400,
  });
  return true;
}

export async function logout() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) db().prepare("DELETE FROM sessions WHERE token=?").run(t);
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  const u = db()
    .prepare(
      `SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON u.id=s.user_id
       WHERE s.token=? AND s.expires_at > datetime('now')`
    )
    .get(t) as User | undefined;
  return u ?? null;
}

/** Para páginas y acciones del panel: corta si no hay sesión. */
export async function requireUser(): Promise<User> {
  const u = await currentUser();
  if (!u) redirect("/admin/login");
  return u;
}

export function changePassword(userId: number, current: string, next: string): string | null {
  const d = db();
  const row = d.prepare("SELECT pass_hash FROM users WHERE id=?").get(userId) as { pass_hash: string } | undefined;
  if (!row || !verifyPassword(current, row.pass_hash)) return "La contraseña actual no es correcta.";
  if (next.length < 8) return "La nueva contraseña debe tener al menos 8 caracteres.";
  d.prepare("UPDATE users SET pass_hash=? WHERE id=?").run(hashPassword(next), userId);
  return null;
}
