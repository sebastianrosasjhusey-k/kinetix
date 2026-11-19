"use client";
import { currentUser, useDb } from "@/lib/store";
import { PasswordForm } from "./PasswordForm";

export default function Cuenta() {
  const u = currentUser(useDb());
  if (!u) return null;
  return (
    <>
      <h1>Cuenta</h1>
      <p className="adm-sub">Ingresas como {u.email}.</p>
      <PasswordForm />
    </>
  );
}
