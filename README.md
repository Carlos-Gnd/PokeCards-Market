# ARCADIUM

> Where Rarity Becomes Value

Plataforma web premium de cartas digitales coleccionables. Monorepo con frontend React+Vite y backend NestJS+Prisma sobre Supabase PostgreSQL.

## Estructura

```
ARCADIUM/
├── frontend/   # Vite + React + TypeScript + Tailwind + Framer Motion
└── backend/    # NestJS + Prisma + PayPal Sandbox
```

## Requisitos

- Node.js 20+
- npm 10+

## Arranque rápido

```bash
# Backend
cd backend
npm install
cp .env.example .env   # completar con credenciales
npx prisma migrate deploy
npm run start:dev      # puerto 3000

# Frontend (en otra terminal)
cd frontend
npm install
cp .env.example .env   # completar con credenciales
npm run dev            # puerto 5173
```

## Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Zustand, React Router DOM, @supabase/supabase-js, @paypal/react-paypal-js
- **Backend**: NestJS 10, Prisma 5, TypeScript, @paypal/checkout-server-sdk, jsonwebtoken (validación de JWT Supabase)
- **Datos**: PokéAPI (cartas) · Supabase PostgreSQL (usuarios, colección, órdenes)

## Sistema de rarezas

| Tier | Drop rate | Precio (USD) |
| --- | --- | --- |
| Core | 50.0% | 1 |
| Alloy | 25.0% | 2 |
| Prime | 12.0% | 4 |
| Elite | 7.0% | 8 |
| Apex | 4.0% | 15 |
| Ascendant | 1.8% | 25 |
| Eternal | 0.2% | 50 |
