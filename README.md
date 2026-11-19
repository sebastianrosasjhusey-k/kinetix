# Kinetix Nutrition · tienda web (versión con servidor)

Esta rama es la versión real, con base de datos SQLite. El mockup que se publica en Netlify está en `main` y simula los datos en el navegador. Ver `CLAUDE.md` para cómo se mantienen iguales.

Sitio público de C-PRIX y panel de administración, hecho con **Next.js 15 (React)** y una base de datos **SQLite propia** que usa el SQLite integrado en Node. No depende de servicios externos.

## Qué incluye

**Sitio público**
- `/` Beneficios de C-PRIX
- `/como-se-usa` Pasos, dosis y contador de scoops
- `/calculadora` Calculadora de plan de carrera (`public/plan-de-carrera.html`)
- `/tienda` Productos con sabores, stock y carrito
- `/pedido/[código]` Confirmación del pedido con botón de WhatsApp

**Compra en dos pasos:** *Agregar al pedido* abre el carrito con el formulario de entrega, y *Confirmar pedido* lo guarda en la base de datos, descuenta stock y muestra el número de pedido (KX-1001, KX-1002…). El pago se coordina por WhatsApp (Yape/Plin, transferencia o contra entrega).

**Panel de administración** (`/admin`)
- Resumen: ventas de hoy y del mes, pedidos por despachar y stock bajo
- Pedidos: lista con filtro por estado y detalle con datos del cliente y enlace a WhatsApp
- Estados: Nuevo, Confirmado, Pagado, Enviado, Entregado, Cancelado (al cancelar, el stock vuelve)
- Productos y stock: precio, precio anterior tachado, textos, stock por sabor, mostrar u ocultar
- Cuenta: cambio de contraseña

Usuario inicial: `admin@kinetix.pe` · contraseña `kinetix2026`. **Cámbiala al primer ingreso.**

## Cómo correrlo

Requiere Node 22.5 o superior.

```bash
npm install
npm run dev        # desarrollo en http://localhost:3000
npm run build && npm start   # producción
```

La base de datos se crea sola en `data/kinetix.db` con los productos y el usuario inicial. Para usar otra ubicación, define `DATABASE_PATH`.

## Base de datos

Tablas: `products`, `variants` (sabores con stock), `orders`, `order_items`, `users`, `sessions`. El esquema y los datos iniciales están en `lib/db.ts`. Las contraseñas se guardan con scrypt y las sesiones en una cookie httpOnly que dura 7 días.

Los precios de HYD-PRIX (S/ 39) y RAW (S/ 35) son provisionales: cámbialos desde el panel.

## Dónde publicarlo

Como la base de datos es un archivo, el servidor necesita **disco persistente**. Netlify y Vercel no lo tienen (cada pedido se perdería), así que este proyecto va en un servidor con Node, por ejemplo:

- Un VPS pequeño (DigitalOcean, Hetzner, Lightsail) con `npm run build && npm start` detrás de Nginx
- Railway, Render o Fly.io con un volumen montado y `DATABASE_PATH` apuntando a él

Haz copia de seguridad de `data/kinetix.db` con regularidad.
