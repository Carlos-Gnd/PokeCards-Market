# PokéCards Market — Parcial #2 Desarrollo Web

**Carlos Granados · Ciclo V · 2026**

Tienda interactiva de cartas Pokémon TCG con autenticación, marketplace, pagos PayPal Sandbox y colección personal.

---

## Nota sobre la API de cartas

El enunciado referencia **PokéAPI** (`pokeapi.co`), que devuelve datos de Pokémon (stats, evoluciones). Para una **tienda de cartas coleccionables**, esa API no provee imágenes de cartas ni precios de mercado.

Se optó por el **Pokémon TCG API** (`pokemontcg.io`) — la API oficial de datos del juego de cartas físico — que sí incluye:

- Imágenes de alta resolución de cada carta (small + large)
- Rareza oficial del juego (`Common`, `Illustration Rare`, `Hyper Rare`…)
- Tipo de Pokémon, número de Pokédex, set de expansión

Los datos de 5 expansiones (951 cartas) fueron descargados vía esa API y cargados en Supabase PostgreSQL. El backend los sirve con cache de 5 minutos.

---

## Stack

```
Frontend (Netlify)          Backend (Azure VPS)         Base de datos
React 18 + Vite      ──►   NestJS + Prisma ORM   ──►   Supabase PostgreSQL
TypeScript                  TypeScript                   (cloud)
Tailwind + Framer Motion         │
Zustand                    PayPal Sandbox API
```

---

## Requerimientos del parcial — cumplimiento

| Requerimiento | Implementación |
|---|---|
| Consumir API pública de Pokémon | ✅ Pokémon TCG API → 951 cartas en 5 expansiones |
| Mostrar ≥ 25 cartas con imagen, nombre, tipo y precio | ✅ Marketplace con filtros por rareza, tipo, precio |
| Seleccionar carta para compra | ✅ Modal de detalle con vista 3D de la carta |
| Botón PayPal Sandbox | ✅ `@paypal/react-paypal-js` con create-order + capture |
| Validar pago exitoso en backend | ✅ Captura verificada en NestJS, transacción atómica |
| Desbloquear carta + mensaje de éxito | ✅ Toast + badge "Owned" + animación de desbloqueo |
| Mensaje de error si falla el pago | ✅ Toast de error, carta permanece bloqueada |
| Ver cartas compradas | ✅ Página `/collection` (Bóveda de Colección) |

### Funcionalidades adicionales
- Sistema de **7 rarezas** con efectos visuales por capas (holo, foil, rayos, partículas)
- **Booster packs**: comprar sobre con 5 cartas aleatorias garantizando al menos 1 rara
- **Registro e inicio de sesión** con Supabase Auth (JWT)
- **Filtros** en marketplace: rareza, tipo, nombre, precio, "solo no poseídas"
- Cartas con efecto 3D **tilt** al mover el mouse
- Diseño responsivo y animado (mobile first)

---

## Ejecución local

```bash
# Backend (terminal 1)
cd backend
npm install
npx prisma generate
npm run start:dev      # http://localhost:3000

# Frontend (terminal 2)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

---

## Producción

| Servicio | URL |
|---|---|
| Frontend | https://pokecardsmarket.netlify.app |
| Backend | http://48.214.145.60:3000 (Azure VPS) |
| Base de datos | Supabase PostgreSQL (cloud) |

El frontend en Netlify usa un proxy inverso (`netlify.toml`) para redirigir `/api/*` al VPS sin exponer la URL HTTP al navegador (evita mixed content).

---

## Credenciales de prueba PayPal Sandbox

Email: sb-ce43gk50925696@personal.example.com
Password: 4zGi?_'Y

El sistema acepta pagos de prueba y registra cada transacción con su `paypalOrderId` en Supabase.
