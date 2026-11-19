import { requireUser } from "@/lib/auth";
import { logoutAction } from "../actions";
import { AdminNav } from "./AdminNav";
import "../admin.css";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-logo">KINETIX<small>Panel de administración</small></div>
        <AdminNav />
        <form className="adm-user" action={logoutAction}>
          <span>{user.name}</span>
          <button type="submit">Cerrar sesión</button>
        </form>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
