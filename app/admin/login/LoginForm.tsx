"use client";
import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action}>
      <h1>Panel Kinetix</h1>
      <p>Ingresa para ver pedidos y administrar productos.</p>
      <label className="field">
        Correo
        <input id="email" name="email" type="email" required autoComplete="username" defaultValue={state?.email} key={state?.email} />
      </label>
      <label className="field">
        Contraseña
        <input id="password" name="password" type="password" required autoComplete="current-password" />
      </label>
      {state?.error && <p className="err" role="alert">{state.error}</p>}
      <button className="abtn red" type="submit" disabled={pending}>{pending ? "Ingresando…" : "Ingresar"}</button>
      <div className="demo">Usuario de prueba: admin@kinetix.pe · contraseña kinetix2026. Cámbiala en Cuenta después de ingresar.</div>
    </form>
  );
}
