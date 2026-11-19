import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import "../admin.css";

export const metadata = { title: "Ingresar al panel", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentUser()) redirect("/admin");
  return (
    <div className="login">
      <LoginForm />
    </div>
  );
}
