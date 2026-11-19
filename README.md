# Kinetix Nutrition · tienda web (mockup)

Esta rama (`main`) es el **mockup** que se publica en Netlify. Funciona completo sin servidor: la base de datos se simula en el navegador de cada visitante, con productos y pedidos de ejemplo. La versión real, con base de datos SQLite en un servidor, está en la rama [`app-nextjs`](../../tree/app-nextjs). Ver `CLAUDE.md` para cómo se mantienen iguales.

Hecho con **Next.js 15 (React)** exportado como sitio estático.

## Qué incluye

**Sitio público**
- `/` Beneficios de C-PRIX
- `/como-se-usa` Pasos, dosis y contador de scoops
- `/calculadora` Calculadora de plan de carrera (`public/plan-de-carrera.html`)
- `/tienda` Productos con sabores, stock y carrito
- `/pedido` Confirmación con número de pedido y botón de WhatsApp

**Panel de administración** (`/admin`)
- Usuario de prueba: `admin@kinetix.pe` · contraseña `kinetix2026`
- Resumen, pedidos con estados (al cancelar vuelve el stock), productos y stock, cambio de contraseña
- Botón para restablecer los datos de ejemplo

Como es una demostración, cada navegador tiene sus propios datos: un pedido hecho en un celular no aparece en el panel abierto en otra computadora. Eso se resuelve con la versión real.

## Publicar en Netlify

`netlify.toml` ya trae la configuración: Netlify ejecuta `npm run build` y publica la carpeta `out`. Cada push a `main` actualiza el sitio.

## Correr en local

Requiere Node 22 o superior.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # genera out/
```
