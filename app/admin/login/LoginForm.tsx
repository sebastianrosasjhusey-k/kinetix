"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { currentUser, login, useDb } from "@/lib/store";

export function LoginForm() {
  const router = useRouter();
  const db = useDb();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (currentUser(db)) router.replace("/admin");
  }, [db, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    if (await login(email, password)) router.replace("/admin");
    else {
      setError("Correo o contraseña incorrectos.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h1>Panel Kinetix</h1>
      <p>Ingresa para ver pedidos y administrar productos.</p>
      <label className="field">
        Correo
        <input id="email" name="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="field">
        Contraseña
        <input id="password" name="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="abtn red" type="submit" disabled={pending}>{pending ? "Ingresando…" : "Ingresar"}</button>
      <div className="demo">Usuario de prueba: admin@kinetix.pe · contraseña kinetix2026.</div>
    </form>
  );
}
