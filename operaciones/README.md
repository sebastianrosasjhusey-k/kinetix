# Kinetix Operaciones

Software interno para gestionar **pedidos, inventario y clientes** de Kinetix (C-PRIX, HYD-PRIX, RAW).
Corre en tu computador; por ahora los datos viven **en memoria** y está preparado para pasar a una base de datos en línea sin reescribir la lógica.

## Cómo usarlo

Requisito: [Node.js 22 o superior](https://nodejs.org).

```bash
npm install
npm run dev          # abre http://127.0.0.1:4000
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor con recarga automática al editar código |
| `npm start` | Servidor normal |
| `npm test` | Pruebas automáticas (reglas de negocio + API) |
| `npm run typecheck` | Verifica tipos de TypeScript |
| `npm run build` y `npm run start:prod` | Compila a JavaScript y lo ejecuta (para servidor) |

Configuración opcional: copia `.env.example` a `.env` (o exporta las variables). `SEED_DEMO=false` arranca sin pedidos de ejemplo.

> ⚠️ **En memoria = se borra al detener el servidor.** Usa *Exportar CSV* en Pedidos para guardar lo importante.

## Qué hace

- **Pedidos**: registro con cliente, entrega, canal (WhatsApp, Instagram, web…), método de pago, envío y descuento. Búsqueda, filtros por estado, detalle, historial y exportación a CSV (abre bien en Excel).
- **Flujo de estados**: `nuevo → confirmado → pagado → enviado → entregado`, o `cancelado`. Contra entrega puede enviarse sin estar pagado. Cancelar devuelve el stock.
- **Inventario por SKU** (producto + sabor): el stock se reserva al crear el pedido. Ingresos de mercadería y ajustes por conteo, todo registrado en un **libro de movimientos**. Alertas de stock mínimo.
- **Clientes**: se crean solos y se reconocen por teléfono (clientes recurrentes, total comprado).
- **Resumen**: ventas, por cobrar, ticket promedio, unidades por SKU, distritos, productos a reponer.

## Buenas prácticas aplicadas

| Práctica | Dónde |
|---|---|
| Arquitectura por capas (dominio → servicios → repositorios → HTTP) | `src/` |
| Persistencia detrás de interfaces (patrón Repository + Unit of Work) | `src/ports/repositories.ts` |
| Transacciones atómicas: si falta stock de un producto, no se descuenta nada | `src/infra/memory/memory-store.ts` |
| Dinero en céntimos enteros (sin errores de redondeo) | `src/domain/money.ts` |
| Precio tomado del catálogo en el servidor y congelado en cada línea del pedido | `OrderService.create` |
| Máquina de estados única; la UI pregunta qué transiciones se permiten | `src/domain/order.ts` |
| Concurrencia optimista (`version`): dos personas editando el mismo pedido → 409 | `OrderService` |
| Idempotencia (`Idempotency-Key`): doble clic o reintento no duplica pedidos | `POST /api/orders` |
| Auditoría: historial de estados y movimientos de stock con usuario y fecha | `history`, `movements` |
| Validación de toda entrada con Zod y errores con formato único | `src/http/schemas.ts`, `error-handler.ts` |
| Seguridad: escape HTML (XSS), CSP y cabeceras, CSV sin inyección de fórmulas, solo escucha en `127.0.0.1`, logs sin datos personales | `public/app.js`, `src/http/app.ts` |
| Configuración validada al arrancar, cierre ordenado del servidor | `src/config.ts`, `src/server.ts` |
| Inyección de dependencias (reloj, generador de IDs) para pruebas deterministas | `src/container.ts` |
| Pruebas automáticas de reglas, concurrencia y API | `tests/` |

## Estructura

```
src/
  domain/          Entidades y reglas puras (pedido, producto, cliente, dinero, errores)
  ports/           Interfaces de repositorios (contrato de persistencia)
  infra/memory/    Implementación en memoria  ← se reemplaza al pasar a línea
  services/        Casos de uso: pedidos, inventario, clientes, reportes
  http/            API REST (Fastify) y validación
  container.ts     Ensambla todo (único lugar que elige la persistencia)
  seed.ts          Catálogo inicial y pedidos de ejemplo
public/            Interfaz web (HTML + CSS + JS, sin build)
tests/             Pruebas con Vitest
```

## API

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/orders?status=&search=&from=&to=&limit=&offset=` | Listar pedidos |
| GET | `/api/orders/export.csv` | Exportar (acepta los mismos filtros) |
| GET | `/api/orders/:id` | Detalle (id o código `KX-1001`) |
| POST | `/api/orders` | Crear (encabezado opcional `Idempotency-Key`) |
| POST | `/api/orders/:id/status` | `{ to, expectedVersion, note }` |
| PATCH | `/api/orders/:id` | Editar entrega/notas `{ expectedVersion, ... }` |
| GET | `/api/catalog` | Productos, SKUs y stock |
| PATCH | `/api/products/:id` · `/api/variants/:sku` | Precio/activo · stock mínimo/activo |
| POST | `/api/variants/:sku/movements` | `{ type: "entrada"\|"ajuste", quantity, reason }` |
| GET | `/api/movements?sku=` | Libro de movimientos |
| GET | `/api/customers` · `/api/reports/summary` | Clientes · indicadores |

El encabezado `X-Operador` indica quién hace el cambio (la interfaz lo toma del campo *Operador*).

## Hoja de ruta para llevarlo a línea

1. **Base de datos**: crear `src/infra/postgres/` que implemente las interfaces de `src/ports/repositories.ts` (por ejemplo con Postgres en Supabase/Neon) y usarla en `src/container.ts`. Los servicios, la API y la interfaz no cambian. `UnitOfWork.run` pasa a ser `BEGIN … COMMIT`, y el descuento de stock un `UPDATE … WHERE stock >= cantidad`.
2. **Usuarios y permisos**: login (sesión o JWT) y roles (admin, ventas, despacho); reemplazar `X-Operador` por el usuario autenticado en `src/http/actor.ts`.
3. **Publicación**: `HOST=0.0.0.0`, HTTPS, límite de solicitudes (`@fastify/rate-limit`) y respaldos automáticos.
4. **Integración con la tienda web**: que los pedidos de la web entren por `POST /api/orders` con `channel: "web"`.
