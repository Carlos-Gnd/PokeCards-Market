'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const paypal = require('@paypal/checkout-server-sdk');

const PORT = Number(process.env.PORT) || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174';
const CORS_ORIGINS = CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
const BOOSTER_PACK_PRICE_USD = Number(process.env.BOOSTER_PACK_PRICE_USD ?? 4.99);
const HIGH_RARITIES = ['Illustration Rare', 'Ultra Rare', 'Special Illustration Rare', 'Hyper Rare', 'Double Rare'];
const HIGH_PRICE_THRESHOLD = 5.0;

if (!process.env.DATABASE_URL) {
  console.error('[server] DATABASE_URL no está definido');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL
  .replace(/([?&])sslmode=[^&]*&?/, '$1')
  .replace(/[?&]$/, '');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

// ----- PayPal client -----
const paypalEnv = (process.env.PAYPAL_ENV ?? 'sandbox').toLowerCase();
const paypalClientId = process.env.PAYPAL_CLIENT_ID;
const paypalSecret = process.env.PAYPAL_CLIENT_SECRET;
let paypalClient = null;
if (paypalClientId && paypalSecret) {
  const environment =
    paypalEnv === 'live'
      ? new paypal.core.LiveEnvironment(paypalClientId, paypalSecret)
      : new paypal.core.SandboxEnvironment(paypalClientId, paypalSecret);
  paypalClient = new paypal.core.PayPalHttpClient(environment);
  console.log(`[server] PayPal client iniciado (${paypalEnv})`);
} else {
  console.warn('[server] PayPal no configurado: faltan PAYPAL_CLIENT_ID/SECRET');
}

const app = express();
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || CORS_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`Origen no permitido: ${origin}`));
    },
  }),
);
app.use(express.json());

// ============================================================
// Helpers
// ============================================================

function rowToCard(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    pokedexNumero: row.pokedex_numero,
    rareza: row.rareza,
    tipo: row.tipo,
    imagenSmall: row.imagen_small,
    imagenLarge: row.imagen_large,
    precioMercado: Number(row.precio_mercado),
    esRara: HIGH_RARITIES.includes(row.rareza) || Number(row.precio_mercado) > HIGH_PRICE_THRESHOLD,
  };
}

async function pickRandomPack(client) {
  const rareQuery = `
    SELECT id, nombre, pokedex_numero, rareza, tipo, imagen_small, imagen_large, precio_mercado
    FROM cartas_pokemon
    WHERE rareza = ANY($1::text[]) OR precio_mercado > $2
    ORDER BY RANDOM()
    LIMIT 1
  `;
  const fillQuery = `
    SELECT id, nombre, pokedex_numero, rareza, tipo, imagen_small, imagen_large, precio_mercado
    FROM cartas_pokemon
    WHERE id <> ALL($1::text[])
    ORDER BY RANDOM()
    LIMIT $2
  `;
  const rareRes = await client.query(rareQuery, [HIGH_RARITIES, HIGH_PRICE_THRESHOLD]);
  if (rareRes.rowCount === 0) throw new Error('No hay cartas raras disponibles');
  const rareCard = rareRes.rows[0];
  const fillRes = await client.query(fillQuery, [[rareCard.id], 4]);
  const all = [...fillRes.rows, rareCard];
  return {
    cards: all.sort(() => Math.random() - 0.5).map(rowToCard),
    guaranteedId: rareCard.id,
  };
}

async function persistPack(client, { userId, paypalOrderId, cards }) {
  if (!userId) return; // sin usuario logueado no persistimos
  const insert = `
    INSERT INTO colecciones_usuario (user_id, carta_id, paypal_order_id, obtenida_de)
    VALUES ($1, $2, $3, 'booster')
  `;
  for (const card of cards) {
    await client.query(insert, [userId, card.id, paypalOrderId ?? null]);
  }
}

// ============================================================
// Endpoints
// ============================================================

app.get('/api/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM cartas_pokemon');
    res.json({ ok: true, totalCartas: rows[0].total, paypal: paypalClient ? paypalEnv : 'disabled' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** Devuelve un sobre aleatorio (sin pago, modo demo). */
app.get('/api/booster-pack', async (_req, res) => {
  try {
    const { cards, guaranteedId } = await pickRandomPack(pool);
    res.json({
      precio: BOOSTER_PACK_PRICE_USD,
      moneda: 'USD',
      cartas: cards,
      cartaGarantizadaId: guaranteedId,
    });
  } catch (err) {
    console.error('[server] Error en /api/booster-pack:', err);
    res.status(500).json({ error: 'No se pudo abrir el sobre', detail: err.message });
  }
});

/** Crea una orden de PayPal por el precio del sobre. */
app.post('/api/booster-pack/create-order', async (_req, res) => {
  if (!paypalClient) {
    return res.status(503).json({ error: 'PayPal no está configurado en el servidor' });
  }
  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: 'arcadium_booster_prismatic',
          description: 'ARCADIUM · Sobre Pokémon TCG Prismatic Evolutions (5 cartas)',
          amount: {
            currency_code: 'USD',
            value: BOOSTER_PACK_PRICE_USD.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'ARCADIUM',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
      },
    });

    const response = await paypalClient.execute(request);
    res.json({
      paypalOrderId: response.result.id,
      amount: BOOSTER_PACK_PRICE_USD.toFixed(2),
      currency: 'USD',
    });
  } catch (err) {
    console.error('[server] create-order error:', err.message);
    res.status(500).json({ error: 'No se pudo crear la orden de PayPal', detail: err.message });
  }
});

/** Captura una orden y devuelve las 5 cartas. Si recibe userId, persiste la colección. */
app.post('/api/booster-pack/capture-order', async (req, res) => {
  if (!paypalClient) {
    return res.status(503).json({ error: 'PayPal no está configurado en el servidor' });
  }
  const { paypalOrderId, userId } = req.body ?? {};
  if (!paypalOrderId) {
    return res.status(400).json({ error: 'paypalOrderId requerido' });
  }

  const dbClient = await pool.connect();
  try {
    const dup = await dbClient.query(
      'SELECT carta_id FROM colecciones_usuario WHERE paypal_order_id = $1',
      [paypalOrderId],
    );
    if (dup.rowCount > 0) {
      return res.status(409).json({ error: 'Orden ya capturada anteriormente' });
    }

    const captureReq = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    captureReq.requestBody({});
    const captureRes = await paypalClient.execute(captureReq);
    const status = captureRes.result?.status;

    if (status !== 'COMPLETED') {
      return res.status(402).json({ error: 'Pago no completado', status });
    }

    const { cards, guaranteedId } = await pickRandomPack(dbClient);
    await persistPack(dbClient, { userId, paypalOrderId, cards });

    res.json({
      success: true,
      paypalOrderId,
      precio: BOOSTER_PACK_PRICE_USD,
      moneda: 'USD',
      cartas: cards,
      cartaGarantizadaId: guaranteedId,
      persisted: Boolean(userId),
    });
  } catch (err) {
    console.error('[server] capture-order error:', err);
    const detail = err?.message ?? 'Error desconocido';
    res.status(500).json({ error: 'No se pudo capturar la orden', detail });
  } finally {
    dbClient.release();
  }
});

/** Lista cartas adquiridas por un usuario. */
app.get('/api/me/collection', async (req, res) => {
  const userId = req.query.userId;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId requerido como query param' });
  }
  try {
    const { rows } = await pool.query(
      `
      SELECT
        cu.carta_id,
        cu.fecha_adquisicion,
        cu.obtenida_de,
        cu.paypal_order_id,
        cp.nombre, cp.pokedex_numero, cp.rareza, cp.tipo,
        cp.imagen_small, cp.imagen_large, cp.precio_mercado
      FROM colecciones_usuario cu
      JOIN cartas_pokemon cp ON cp.id = cu.carta_id
      WHERE cu.user_id = $1
      ORDER BY cu.fecha_adquisicion DESC
    `,
      [userId],
    );
    const items = rows.map((r) => ({
      cartaId: r.carta_id,
      fechaAdquisicion: r.fecha_adquisicion,
      obtenidaDe: r.obtenida_de,
      paypalOrderId: r.paypal_order_id,
      carta: {
        id: r.carta_id,
        nombre: r.nombre,
        pokedexNumero: r.pokedex_numero,
        rareza: r.rareza,
        tipo: r.tipo,
        imagenSmall: r.imagen_small,
        imagenLarge: r.imagen_large,
        precioMercado: Number(r.precio_mercado),
      },
    }));
    res.json({ count: items.length, items });
  } catch (err) {
    console.error('[server] /api/me/collection error:', err);
    res.status(500).json({ error: 'No se pudo cargar la colección' });
  }
});

app.listen(PORT, () => {
  console.log(`[server] Express escuchando en http://localhost:${PORT}`);
  console.log(`[server] Orígenes CORS permitidos: ${CORS_ORIGINS.join(', ')}`);
  console.log(`[server] Precio del sobre: $${BOOSTER_PACK_PRICE_USD.toFixed(2)} USD`);
});
