"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { currentUser, logout, useDb } from "@/lib/store";
import { AdminNav } from "./AdminNav";

/** Protege el panel: sin sesión, manda al login. */
export function PanelShell({ children }: { children: React.ReactNode }) {
  const db = useDb();
  const router = useRouter();
  const user = currentUser(db);

  useEffect(() => {
    if (db && !user) router.replace("/admin/login");
  }, [db, user, router]);

  if (!db || !user) return <div className="login" />;

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-logo">KINETIX<small>Panel de administración</small></div>
        <AdminNav />
        <div className="adm-user">
          <span>{user.name}</span>
          <button type="button" onClick={() => { logout(); router.replace("/admin/login"); }}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
