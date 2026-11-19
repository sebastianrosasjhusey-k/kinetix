import { requireUser } from "@/lib/auth";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "Cuenta" };

export default async function Cuenta() {
  const u = await requireUser();
  return (
    <>
      <h1>Cuenta</h1>
      <p className="adm-sub">Ingresas como {u.email}.</p>
      <PasswordForm />
    </>
  );
}
