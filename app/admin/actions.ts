"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { changePassword, login, logout, requireUser } from "@/lib/auth";
import { setOrderStatus, updateProduct, updateVariant } from "@/lib/catalog";

export type FormState = { error?: string; ok?: string; email?: string } | undefined;

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") || "");
  const ok = await login(email, String(fd.get("password") || ""));
  if (!ok) return { error: "Correo o contraseña incorrectos.", email };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

export async function statusAction(fd: FormData) {
  await requireUser();
  setOrderStatus(Number(fd.get("id")), String(fd.get("status")));
  revalidatePath("/admin", "layout");
}

const cents = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").replace(",", ".").trim();
  if (!s) return null;
  const n = Math.round(Number(s) * 100);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

export async function productAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const price = cents(fd.get("price"));
  const compare = cents(fd.get("compare"));
  if (price === null || Number.isNaN(price) || price <= 0) return { error: "Escribe un precio mayor que 0, por ejemplo 95.00." };
  if (Number.isNaN(compare)) return { error: "El precio anterior no es un número válido." };
  if (compare !== null && compare <= price) return { error: "El precio anterior debe ser mayor que el precio actual, o déjalo vacío." };
  updateProduct(Number(fd.get("id")), {
    priceCents: price,
    compareCents: compare,
    active: fd.get("active") === "on",
    tagline: String(fd.get("tagline") || "").slice(0, 80),
    size: String(fd.get("size") || "").slice(0, 60),
    description: String(fd.get("description") || "").slice(0, 400),
  });
  const variantIds = fd.getAll("variant").map(Number);
  for (const vid of variantIds) {
    const stock = Math.trunc(Number(fd.get(`stock-${vid}`)));
    if (!Number.isFinite(stock) || stock < 0) return { error: "El stock debe ser un número entero de 0 o más." };
    updateVariant(vid, { stock, active: fd.get(`active-${vid}`) === "on" });
  }
  revalidatePath("/", "layout");
  return { ok: "Guardado. La tienda ya muestra los cambios." };
}

export async function passwordAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser();
  const next = String(fd.get("next") || "");
  if (next !== String(fd.get("confirm") || "")) return { error: "La nueva contraseña y su confirmación no coinciden." };
  const err = changePassword(u.id, String(fd.get("current") || ""), next);
  return err ? { error: err } : { ok: "Contraseña actualizada." };
}
