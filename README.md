# ARCADIUM

> Plataforma de cartas coleccionables Pokémon TCG con pagos reales vía PayPal Sandbox.

```
frontend (React + Vite)  ──►  backend (NestJS)  ──►  Supabase PostgreSQL
       :5173                      :3000                  (cloud)
                                    │
                              PayPal Sandbox API
```

---

## Índice

1. [Arquitectura](#arquitectura)
2. [Requisitos previos](#requisitos-previos)
3. [Configuración de variables de entorno](#configuración-de-variables-de-entorno)
4. [Instalación y ejecución](#instalación-y-ejecución)
5. [Seed de la base de datos](#seed-de-la-base-de-datos)
6. [Estructura del proyecto](#estructura-del-proyecto)
7. [API — endpoints](#api--endpoints)
8. [Sistema de rarezas](#sistema-de-rarezas)
9. [Problemas conocidos y soluciones](#problemas-conocidos-y-soluciones)

---

## Arquitectura

El proyecto tiene **dos directorios principales**:

| Directorio  | Stack                            | Puerto | Descripción                              |
|-------------|----------------------------------|--------|------------------------------------------|
| `frontend/` | React 18 · Vite · Tailwind · Framer Motion | 5173 | UI de cartas, marketplace, colección, sobres |
| `backend/`  | NestJS · Prisma · TypeScript     | 3000   | API REST unificada (auth, cartas, pagos, booster) |

> **El directorio `express-api/` fue eliminado.** Sus endpoints de booster pack fueron migrados al módulo `BoosterModule` del backend NestJS. El frontend ya apunta todo a `VITE_API_URL` (puerto 3000).

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|---------------|
| Node.js     | 20 LTS        |
| npm         | 10+           |
| PostgreSQL   | Supabase (cloud) — no necesita instalación local |

---

## Configuración de variables de entorno

### Backend — `backend/.env`

Copia `backend/.env.example` a `backend/.env` y completa:

```env
# App
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Supabase Postgres — transaction pooler (pgBouncer, puerto 6543)
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"

# Supabase Postgres — direct connection (para migraciones Prisma, puerto 5432)
DIRECT_URL="postgresql://postgres.<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require"

# Supabase Auth
SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_JWT_SECRET=<jwt-secret-from-supabase-dashboard>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# PayPal Sandbox
PAYPAL_CLIENT_ID=<sandbox-client-id>
PAYPAL_CLIENT_SECRET=<sandbox-client-secret>
PAYPAL_ENV=sandbox

# Booster pack
BOOSTER_PACK_PRICE_USD=4.99
```

> **Dónde encontrar `SUPABASE_JWT_SECRET`:** Supabase Dashboard → Settings → API → JWT Settings → JWT Secret.

### Frontend — `frontend/.env`

Copia `frontend/.env.example` a `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_PAYPAL_CLIENT_ID=<sandbox-client-id>
```

> `VITE_BOOSTER_API_URL` ya **no existe** — el booster está integrado en el backend NestJS.

---

## Instalación y ejecución

### 1. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Aplicar migraciones Prisma

```bash
cd backend
npx prisma generate        # genera el cliente
npx prisma migrate deploy  # aplica migraciones en Supabase
```

### 3. Poblar la tabla de cartas (seed)

La tabla `cartas_pokemon` se llena desde el JSON oficial de Prismatic Evolutions.

```bash
# Necesitas el archivo sv3pt5.json — descárgalo desde pokemontcg.io o usa el que tienes
# Edita CARDS_JSON_PATH en backend/.env apuntando al archivo

cd backend
CARDS_JSON_PATH=/ruta/absoluta/a/sv3pt5.json node -e "
  require('dotenv').config();
  const { Client } = require('pg');
  // Usa el seed.js que está en la raíz del proyecto
"
```

> **Forma más simple:** copia `seed.js` de la raíz a `backend/` y ejecuta:
> ```bash
> cd backend
> node seed.js
> ```
> El script crea la tabla `cartas_pokemon` si no existe y hace upsert de todas las cartas.

### 4. Levantar en desarrollo

```bash
# Terminal 1 — Backend
cd backend
npm run start:dev     # hot reload, escucha en :3000

# Terminal 2 — Frontend
cd frontend
npm run dev           # Vite HMR, escucha en :5173
```

Abre [http://localhost:5173](http://localhost:5173).

### 5. Producción

```bash
# Backend
cd backend
npm run build
npm run start:prod    # node dist/main

# Frontend
cd frontend
npm run build         # genera dist/
npm run preview       # sirve dist/ en :4173
```

---

## Seed de la base de datos

El archivo `seed.js` crea (si no existe) y rellena la tabla `cartas_pokemon` con el JSON de cartas:

```bash
# Desde la raíz del proyecto o desde backend/
DATABASE_URL="<tu-connection-string>" \
CARDS_JSON_PATH="/ruta/a/sv3pt5.json" \
node seed.js
```

**Salida esperada:**

```
[seed] Leyendo sv3pt5.json...
[seed] 207 cartas detectadas
[seed] Conectado a Postgres
[seed] Tabla cartas_pokemon lista
[seed] Insertadas: 207, ya existentes: 0, total en tabla: 207
[seed] Conexión cerrada
```

---

## Estructura del proyecto

```
ARCADIUM/
├── backend/                          # NestJS API unificada
│   ├── prisma/
│   │   └── schema.prisma             # modelos: User, Card, Order, UserCard
│   └── src/
│       ├── app.module.ts             # módulo raíz
│       ├── main.ts                   # bootstrap
│       ├── auth/
│       │   ├── auth.controller.ts    # POST /api/auth/register
│       │   ├── supabase-auth.guard.ts
│       │   └── current-user.decorator.ts
│       ├── booster/                  # ← migrado desde express-api
│       │   ├── booster.module.ts
│       │   ├── booster.controller.ts # GET /demo, POST /create-order, /capture-order
│       │   ├── booster.service.ts
│       │   └── booster.types.ts
│       ├── cards/
│       │   ├── cards.controller.ts   # GET /api/cards, /api/cards/:id
│       │   ├── cards.service.ts
│       │   ├── pokeapi.service.ts    # lee cartas_pokemon + cache 5 min
│       │   └── rarity.util.ts        # determinismo rareza/variante
│       ├── collection/
│       │   ├── collection.controller.ts  # GET /api/collection, /ids
│       │   └── collection.service.ts
│       ├── payments/
│       │   ├── payments.controller.ts    # POST /api/payments/create-order, /capture-order
│       │   ├── payments.service.ts
│       │   ├── paypal.client.ts          # wrapper PayPal SDK
│       │   └── dto.ts
│       ├── prisma/
│       │   └── prisma.service.ts
│       └── users/
│           └── users.service.ts
│
├── frontend/                         # React + Vite
│   └── src/
│       ├── components/
│       │   ├── card/                 # sistema de cartas 3D
│       │   │   ├── Card.tsx          # compositor principal
│       │   │   ├── rarity-themes.ts  # temas por rareza
│       │   │   ├── variant-visuals.ts
│       │   │   ├── hooks/useTilt3D.ts
│       │   │   ├── layers/           # efectos visuales por capas
│       │   │   └── parts/            # artwork, badges, metadata, slab
│       │   ├── layout/
│       │   │   ├── TopNavBar.tsx
│       │   │   ├── AppLayout.tsx
│       │   │   └── Footer.tsx
│       │   └── ui/                   # Modal, Spinner, TypeBadge...
│       ├── pages/
│       │   ├── Landing.tsx
│       │   ├── Marketplace.tsx
│       │   ├── CollectionVault.tsx
│       │   └── BoosterPack.jsx
│       ├── store/
│       │   ├── authStore.ts          # Supabase Auth
│       │   └── collectionStore.ts    # Zustand
│       ├── services/
│       │   ├── cards.service.ts
│       │   └── payments.service.ts
│       ├── lib/
│       │   ├── rarity.ts
│       │   └── utils.ts
│       └── styles/
│           ├── index.css
│           └── booster.css
│
└── seed.js                           # poblar cartas_pokemon
```

---

## API — endpoints

Base URL: `http://localhost:3000/api`

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/auth/register` | ✗ | Crea perfil de usuario en BD tras registro Supabase |

### Cartas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/cards` | ✗ | Lista todas las cartas del catálogo |
| `GET` | `/cards/trending` | ✗ | Top 8 cartas (para landing) |
| `GET` | `/cards/:pokemonId` | ✗ | Detalle de una carta |

### Pagos (marketplace)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/payments/create-order` | ✅ | Crea orden PayPal para comprar carta |
| `POST` | `/payments/capture-order` | ✅ | Captura el pago y desbloquea carta |
| `GET` | `/payments/history` | ✅ | Historial de órdenes del usuario |

### Colección

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/collection` | ✅ | Cartas del usuario |
| `GET` | `/collection/ids` | ✅ | Solo los pokemonId poseídos (para badges "owned") |

### Booster packs

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/booster/demo` | ✗ | Sobre aleatorio sin pago (demo/testing) |
| `POST` | `/booster/create-order` | ✗ | Crea orden PayPal por $4.99 |
| `POST` | `/booster/capture-order` | ✗ | Captura y devuelve 5 cartas |

### Health

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Estado del servicio |

---

## Sistema de rarezas

Las rarezas y variantes son **deterministas** — se calculan del `pokemonId` para que la misma carta siempre tenga la misma rareza:

| Tier        | Label                    | Efectos visuales                     |
|-------------|--------------------------|--------------------------------------|
| `core`      | Common / Uncommon        | Sin efectos                           |
| `alloy`     | Rare                     | Shimmer sutil                         |
| `prime`     | Double Rare              | Shimmer + Holo parcial                |
| `elite`     | Ultra Rare               | Holo completo + partículas            |
| `apex`      | Illustration Rare        | Rayos + Foil + partículas             |
| `ascendant` | Special Illustration Rare| Holo rainbow + Foil prismatic         |
| `eternal`   | Hyper Rare               | Todas las capas activas               |

**Variantes** disponibles: `standard`, `luminous`, `signature`, `prestige`, `vaulted`.

---

## Problemas conocidos y soluciones

### `cartas_pokemon` no existe

```
Error: relation "cartas_pokemon" does not exist
```

**Solución:** Ejecutar el seed → `node seed.js` con `CARDS_JSON_PATH` apuntando al JSON.

### PayPal no configurado

```
ServiceUnavailableException: PayPal no está configurado en el servidor
```

**Solución:** Agregar `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET` en `backend/.env`. Para desarrollo, usa cuentas de [PayPal Sandbox](https://developer.paypal.com/tools/sandbox/).

### JWT sin verificar (warning en consola)

```
[SupabaseAuthGuard] SUPABASE_JWT_SECRET no configurado: validando solo decode
```

**Solución:** Copiar el JWT Secret desde Supabase Dashboard → Settings → API → JWT Settings → JWT Secret y agregarlo como `SUPABASE_JWT_SECRET` en `backend/.env`.

### Error de CORS en desarrollo

```
Access-Control-Allow-Origin blocked
```

**Solución:** Verificar que `CORS_ORIGIN=http://localhost:5173` esté en `backend/.env` y que el frontend esté corriendo en ese puerto.

### Prisma: `P1001` no puede conectar a la BD

```
Can't reach database server at ...
```

**Solución:** Verificar `DATABASE_URL` en `backend/.env`. Asegurarse de usar el connection pooler de Supabase (puerto **6543**, no 5432) para el runtime, y `DIRECT_URL` con puerto 5432 solo para migraciones.

---

## Scripts disponibles

### Backend

```bash
npm run start:dev      # desarrollo con hot reload
npm run start:prod     # producción
npm run build          # compilar TypeScript
npm run lint           # ESLint con auto-fix
npm run test           # tests unitarios
npm run test:e2e       # tests end-to-end
npx prisma studio      # GUI para explorar la BD
npx prisma migrate dev # crear nueva migración
```

### Frontend

```bash
npm run dev            # Vite dev server
npm run build          # build de producción
npm run preview        # previsualizar build
npm run lint           # ESLint
```