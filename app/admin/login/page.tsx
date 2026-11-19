import { LoginForm } from "./LoginForm";
import "../admin.css";

export const metadata = { title: "Ingresar al panel", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="login">
      <LoginForm />
    </div>
  );
}
