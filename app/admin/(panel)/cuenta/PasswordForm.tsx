"use client";
import { useState } from "react";
import { changePassword } from "@/lib/store";

export function PasswordForm() {
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const next = String(fd.get("next") || "");
    if (next !== String(fd.get("confirm") || "")) return setMsg({ error: "La nueva contraseña y su confirmación no coinciden." });
    setPending(true);
    const err = await changePassword(String(fd.get("current") || ""), next);
    setPending(false);
    if (err) setMsg({ error: err });
    else {
      form.reset();
      setMsg({ ok: "Contraseña actualizada." });
    }
  }

  return (
    <form className="panel" onSubmit={submit} style={{ maxWidth: 460, display: "grid", gap: 12 }}>
      <h2>Cambiar contraseña</h2>
      <label className="field">Contraseña actual<input id="current" name="current" type="password" required autoComplete="current-password" /></label>
      <label className="field">Nueva contraseña<input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" /></label>
      <label className="field">Repite la nueva contraseña<input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" /></label>
      {msg.error && <p className="err" role="alert">{msg.error}</p>}
      {msg.ok && <p className="ok-msg" role="status">{msg.ok}</p>}
      <button className="abtn" type="submit" disabled={pending}>{pending ? "Guardando…" : "Cambiar contraseña"}</button>
    </form>
  );
}
