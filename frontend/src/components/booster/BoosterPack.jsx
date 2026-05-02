import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import '../../styles/booster.css';

const BOOSTER_API_URL =
  import.meta.env.VITE_BOOSTER_API_URL ?? 'http://localhost:3001';
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const BOOSTER_PACK_PRICE_USD = 4.99;

const HIGH_RARITIES = new Set([
  'Illustration Rare',
  'Ultra Rare',
  'Special Illustration Rare',
  'Hyper Rare',
  'Double Rare',
]);

const LEGENDARY_RARITIES = new Set([
  'Special Illustration Rare',
  'Hyper Rare',
]);

function isHighRarity(card) {
  if (!card) return false;
  if (HIGH_RARITIES.has(card.rareza)) return true;
  return Number(card.precioMercado ?? 0) > 5;
}

function rarityBadgeClass(rareza) {
  switch (rareza) {
    case 'Special Illustration Rare':
    case 'Hyper Rare':
      return 'bg-gold/20 text-gold border-gold/40';
    case 'Illustration Rare':
    case 'Ultra Rare':
      return 'bg-primary/20 text-primary-glow border-primary/40';
    case 'Double Rare':
      return 'bg-accent/20 text-accent border-accent/40';
    case 'Rare':
      return 'bg-white/10 text-white border-white/20';
    default:
      return 'bg-white/[0.04] text-white/60 border-white/10';
  }
}

export default function BoosterPack({ userId = null }) {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'paying' | 'opening' | 'revealed'
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState(new Set());
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const paypalOptions = useMemo(
    () => ({
      'client-id': PAYPAL_CLIENT_ID,
      currency: 'USD',
      intent: 'capture',
      'enable-funding': 'card',
      'disable-funding': 'paylater,credit',
    }),
    [],
  );

  const beginReveal = useCallback((fetched) => {
    setCards(fetched);
    setFlipped(new Set());
    setPhase('opening');
    window.setTimeout(() => setPhase('revealed'), 1100);
  }, []);

  const handleCreateOrder = useCallback(async () => {
    setError(null);
    const res = await fetch(`${BOOSTER_API_URL}/api/booster-pack/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.paypalOrderId;
  }, []);

  const handleApprove = useCallback(
    async (data) => {
      setError(null);
      setPhase('paying');
      try {
        const res = await fetch(`${BOOSTER_API_URL}/api/booster-pack/capture-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paypalOrderId: data.orderID, userId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const result = await res.json();
        setSuccess({
          paypalOrderId: result.paypalOrderId,
          persisted: result.persisted,
        });
        beginReveal(result.cartas);
      } catch (err) {
        setError(err.message ?? 'No se pudo confirmar el pago');
        setPhase('idle');
      }
    },
    [beginReveal, userId],
  );

  const handleDemoOpen = useCallback(async () => {
    setError(null);
    setPhase('paying');
    try {
      const res = await fetch(`${BOOSTER_API_URL}/api/booster-pack`, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.cartas) || data.cartas.length === 0) {
        throw new Error('Respuesta inválida del servidor');
      }
      setSuccess(null);
      beginReveal(data.cartas);
    } catch (err) {
      setError(err.message ?? 'No se pudo abrir el sobre');
      setPhase('idle');
    }
  }, [beginReveal]);

  const handleFlip = useCallback((id) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setPhase('idle');
    setCards([]);
    setFlipped(new Set());
    setError(null);
    setSuccess(null);
  }, []);

  const flipAll = useCallback(() => {
    setFlipped(new Set(cards.map((c) => c.id)));
  }, [cards]);

  const showPaymentUI = phase === 'idle' || phase === 'paying';

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12">
      <header className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-3">
          Pokémon TCG · Scarlet &amp; Violet · Prismatic Evolutions
        </p>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-gradient mb-3">
          Abre tu sobre
        </h1>
        <p className="text-white/60 max-w-xl mx-auto">
          Cinco cartas garantizadas. Al menos una de rareza alta en cada sobre.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/10 px-4 py-1.5">
          <span className="text-white/60 text-sm">Precio del sobre</span>
          <span className="font-mono font-semibold text-gold">
            ${BOOSTER_PACK_PRICE_USD.toFixed(2)} USD
          </span>
        </div>
      </header>

      {error && (
        <div className="max-w-md mx-auto mb-6 rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error text-center">
          {error}
        </div>
      )}

      {success && phase === 'revealed' && (
        <div className="max-w-md mx-auto mb-6 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-success text-center">
          Compra exitosa · Orden {success.paypalOrderId.slice(-8)}
          {success.persisted ? ' · cartas guardadas en tu colección' : ''}
        </div>
      )}

      <AnimatePresence mode="wait">
        {showPaymentUI && (
          <motion.section
            key="pack"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40, transition: { duration: 0.4 } }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              className="bp-pack-shell"
              role="img"
              aria-label="Sobre Prismatic Evolutions"
              animate={{
                y: [0, -8, 0],
                transition: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' },
              }}
            />

            <div className="w-full max-w-sm flex flex-col items-stretch gap-3">
              {PAYPAL_CLIENT_ID ? (
                <PayPalScriptProvider options={paypalOptions}>
                  <PayPalButtons
                    style={{ layout: 'vertical', shape: 'pill', label: 'paypal', height: 44 }}
                    disabled={phase === 'paying'}
                    createOrder={handleCreateOrder}
                    onApprove={handleApprove}
                    onError={(err) => {
                      setError(err?.message ?? 'PayPal devolvió un error');
                      setPhase('idle');
                    }}
                    onCancel={() => setPhase('idle')}
                  />
                </PayPalScriptProvider>
              ) : (
                <p className="text-error text-sm text-center">
                  Falta VITE_PAYPAL_CLIENT_ID en el .env del frontend.
                </p>
              )}

              <button
                type="button"
                onClick={handleDemoOpen}
                disabled={phase === 'paying'}
                className="btn-ghost text-xs text-white/50 hover:text-white/80"
              >
                {phase === 'paying' ? 'Procesando…' : 'Probar sin pagar (modo demo)'}
              </button>
            </div>

            <p className="text-white/40 text-xs">
              Pagos en sandbox: usa una cuenta de prueba PayPal Sandbox.
            </p>
          </motion.section>
        )}

        {phase === 'opening' && (
          <motion.div
            key="opening"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              className="bp-pack-shell"
              animate={{
                x: [0, -10, 12, -8, 8, -4, 0],
                rotate: [0, -3, 3, -2, 2, 0],
                y: [0, 0, 0, 0, 40, 320],
                opacity: [1, 1, 1, 1, 1, 0],
                scale: [1, 1.03, 1.03, 1.03, 1, 0.85],
              }}
              transition={{ duration: 1.05, times: [0, 0.15, 0.3, 0.45, 0.6, 0.85, 1] }}
            />
            <p className="text-white/60 text-sm">Abriendo sobre…</p>
          </motion.div>
        )}

        {phase === 'revealed' && (
          <motion.section
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 w-full max-w-4xl mx-auto bp-perspective">
              {cards.map((card, idx) => {
                const high = isHighRarity(card);
                const legendary = LEGENDARY_RARITIES.has(card.rareza);
                const isFlipped = flipped.has(card.id);
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 60, rotate: -6 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{
                      delay: 0.08 * idx,
                      duration: 0.55,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative"
                  >
                    <div
                      className={`bp-flip-card ${isFlipped ? 'is-flipped' : ''}`}
                      onClick={() => handleFlip(card.id)}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const mx = ((e.clientX - rect.left) / rect.width) * 100;
                        const my = ((e.clientY - rect.top) / rect.height) * 100;
                        e.currentTarget.style.setProperty('--bp-mx', `${mx}%`);
                        e.currentTarget.style.setProperty('--bp-my', `${my}%`);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleFlip(card.id);
                        }
                      }}
                      aria-label={`Voltear carta ${card.nombre}`}
                    >
                      <div className="bp-flip-face">
                        <div className="bp-card-back" />
                      </div>
                      <div
                        className={`bp-flip-face bp-flip-back ${
                          high ? 'bp-holo' : ''
                        } ${legendary ? 'bp-holo-legendary' : ''}`}
                      >
                        {card.imagenLarge ? (
                          <img
                            className="bp-card-front-img"
                            src={card.imagenLarge}
                            alt={card.nombre}
                            loading="lazy"
                          />
                        ) : (
                          <div className="bp-card-skeleton w-full h-full" />
                        )}
                      </div>
                    </div>
                    {isFlipped && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="mt-3 text-center"
                      >
                        <p className="font-display font-semibold text-white truncate text-sm">
                          {card.nombre}
                        </p>
                        <div
                          className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${rarityBadgeClass(
                            card.rareza,
                          )}`}
                        >
                          {card.rareza ?? 'Sin clasificar'}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
              <button type="button" onClick={flipAll} className="btn-secondary">
                Voltear todas
              </button>
              <button type="button" onClick={handleReset} className="btn-primary">
                Comprar otro sobre
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
