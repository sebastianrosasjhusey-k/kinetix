# Kinetix · instrucciones del proyecto

Hay **dos versiones** del mismo sitio y deben quedar iguales para el cliente:

| Rama | Qué es | Datos | Dónde se publica |
|---|---|---|---|
| `main` | Mockup (exportación estática de Next.js) | Simulados en el navegador: `lib/store.ts` (localStorage) | Netlify, automático al hacer push |
| `app-nextjs` | Versión real con servidor | SQLite en `data/kinetix.db`: `lib/db.ts`, `lib/catalog.ts`, `lib/auth.ts` | Servidor con disco (Railway, Render o VPS) |

**Regla:** todo cambio de diseño, textos, productos, precios iniciales o funciones se aplica en las dos ramas en el mismo trabajo. Lo único que cambia entre ellas es la capa de datos:

- En `main` las páginas leen con `useDb()` y escriben con las funciones de `lib/store.ts`.
- En `app-nextjs` las páginas leen en el servidor con `lib/catalog.ts` y escriben con server actions (`app/(sitio)/actions.ts`, `app/admin/actions.ts`).
- Rutas con id: en `main` van por parámetro (`/pedido?c=…&k=…`, `/admin/pedido?id=…`); en `app-nextjs` por segmento (`/pedido/KX-1001?k=…`, `/admin/pedidos/1`).
- Los datos iniciales (productos, precios, stock, usuario admin) están en `seed()` de `lib/store.ts` y de `lib/db.ts`: si cambian, cambiar los dos.

Antes de subir: `npm run build` sin errores en cada rama.

## `operaciones/` (software interno, aparte del sitio)

Proyecto Node/TypeScript independiente para gestionar pedidos, inventario y clientes (ver `operaciones/README.md`). No forma parte de la tienda: no se replica en `app-nextjs` y está excluido del `tsconfig.json` raíz. Si cambian productos o precios en `seed()`, actualizar también `operaciones/src/seed.ts`. Antes de subir: `npm test` y `npm run typecheck` dentro de `operaciones/`.
