"use client";
import { useActionState } from "react";
import { passwordAction } from "../../actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(passwordAction, undefined);
  return (
    <form className="panel" action={action} style={{ maxWidth: 460, display: "grid", gap: 12 }}>
      <h2>Cambiar contraseña</h2>
      <label className="field">Contraseña actual<input id="current" name="current" type="password" required autoComplete="current-password" /></label>
      <label className="field">Nueva contraseña<input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" /></label>
      <label className="field">Repite la nueva contraseña<input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" /></label>
      {state?.error && <p className="err" role="alert">{state.error}</p>}
      {state?.ok && <p className="ok-msg" role="status">{state.ok}</p>}
      <button className="abtn" type="submit" disabled={pending}>{pending ? "Guardando…" : "Cambiar contraseña"}</button>
    </form>
  );
}
