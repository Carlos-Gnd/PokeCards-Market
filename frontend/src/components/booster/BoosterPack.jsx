import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PayPalButtons } from "@paypal/react-paypal-js";
import "../../styles/booster.css";
import { api } from "../../lib/api";

const API_URL = import.meta.env.VITE_API_URL || "";
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const BOOSTER_PACK_PRICE_USD = 4.99;

const HIGH_RARITIES = new Set([
  "Illustration Rare",
  "Ultra Rare",
  "Special Illustration Rare",
  "Hyper Rare",
  "Double Rare",
]);

const LEGENDARY_RARITIES = new Set(["Special Illustration Rare", "Hyper Rare"]);

function isHighRarity(card) {
  if (!card) return false;
  if (HIGH_RARITIES.has(card.rarityLabel)) return true;
  return Number(card.marketPrice ?? 0) > 5;
}

function rarityBadgeClass(rarityLabel) {
  switch (rarityLabel) {
    case "Special Illustration Rare":
    case "Hyper Rare":
      return "bg-gold/20 text-gold border-gold/40";
    case "Illustration Rare":
    case "Ultra Rare":
      return "bg-primary/20 text-primary-glow border-primary/40";
    case "Double Rare":
      return "bg-accent/20 text-accent border-accent/40";
    case "Rare":
      return "bg-white/10 text-white border-white/20";
    default:
      return "bg-white/[0.04] text-white/60 border-white/10";
  }
}

// ── Modal de visualización en grande ─────────────────────────────────────────
function CardZoomModal({ card, onClose }) {
  if (!card) return null;

  // ¡USAMOS LOS STATS REALES DE LA BASE DE DATOS! 🚀
  const stats = card.stats || { hp: 0, attack: 0, defense: 0, speed: 0 };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="relative z-10 flex flex-col sm:flex-row items-center gap-6 max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-shrink-0">
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-64 sm:w-72 rounded-2xl shadow-2xl"
              style={{
                boxShadow: isHighRarity(card)
                  ? "0 0 60px rgba(109,94,248,0.5), 0 20px 50px rgba(0,0,0,0.6)"
                  : "0 20px 50px rgba(0,0,0,0.6)",
              }}
            />
          ) : (
            <div className="w-64 sm:w-72 aspect-[245/342] rounded-2xl bg-surface-2 bp-card-skeleton" />
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <p className="font-display font-black text-2xl text-white leading-tight">
              {card.name}
            </p>
            {card.type && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-white/70">
                {card.type}
              </span>
            )}
          </div>

          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium ${rarityBadgeClass(card.rarityLabel)}`}
          >
            {card.rarityLabel ?? "Sin clasificar"}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatRow label="HP" value={stats.hp} color="text-rose-400" />
            <StatRow
              label="Ataque"
              value={stats.attack}
              color="text-orange-400"
            />
            <StatRow
              label="Defensa"
              value={stats.defense}
              color="text-blue-400"
            />
            <StatRow
              label="Velocidad"
              value={stats.speed}
              color="text-emerald-400"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-xs text-white/50 uppercase tracking-wider">
              Precio de mercado
            </span>
            <span className="font-mono font-bold text-gold">
              ${Number(card.marketPrice ?? 0).toFixed(2)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white/70 hover:text-white text-sm transition-colors"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-wider text-white/45">
          {label}
        </div>
        <div className={`font-mono font-bold text-sm ${color}`}>{value}</div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function BoosterPack({ userId = null }) {
  const [phase, setPhase] = useState("idle");
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState(new Set());
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [zoomed, setZoomed] = useState(null);

  const beginReveal = useCallback((fetched) => {
    setCards(fetched);
    setFlipped(new Set());
    setPhase("opening");
    window.setTimeout(() => setPhase("revealed"), 1100);
  }, []);

  const handleCreateOrder = useCallback(async () => {
    setError(null);
    const { data } = await api.post("/booster/create-order", {});
    return data.paypalOrderId;
  }, []);

  const handleApprove = useCallback(
    async (data) => {
      setError(null);
      setPhase("paying");
      try {
        const res = await fetch(`${API_URL}/api/booster/capture-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paypalOrderId: data.orderID, userId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? `HTTP ${res.status}`);
        }
        const result = await res.json();
        setSuccess({
          paypalOrderId: result.paypalOrderId,
          persisted: result.persisted,
        });
        beginReveal(result.cartas);
      } catch (err) {
        setError(err.message ?? "No se pudo confirmar el pago");
        setPhase("idle");
      }
    },
    [beginReveal, userId],
  );

  const handleDemoOpen = useCallback(async () => {
    setError(null);
    setPhase("paying");
    try {
      const res = await fetch(`${API_URL}/api/booster/demo`, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.cartas) || data.cartas.length === 0) {
        throw new Error("Respuesta inválida del servidor");
      }
      setSuccess(null);
      beginReveal(data.cartas);
    } catch (err) {
      setError(err.message ?? "No se pudo abrir el sobre");
      setPhase("idle");
    }
  }, [beginReveal]);

  const handleFlip = useCallback((id) => {
    setFlipped((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setPhase("idle");
    setCards([]);
    setFlipped(new Set());
    setError(null);
    setSuccess(null);
    setZoomed(null);
  }, []);

  const flipAll = useCallback(() => {
    setFlipped(new Set(cards.map((c) => c.tcgId)));
  }, [cards]);

  const showPaymentUI = phase === "idle" || phase === "paying";

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">
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

      {success && phase === "revealed" && (
        <div className="max-w-md mx-auto mb-6 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-success text-center">
          Compra exitosa · Orden {success.paypalOrderId.slice(-8)}
          {success.persisted ? " · cartas guardadas en tu colección" : ""}
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
                y: [0, -10, 0],
                transition: {
                  duration: 3.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            />

            <div className="w-full max-w-sm flex flex-col items-stretch gap-3">
              {PAYPAL_CLIENT_ID ? (
                <PayPalButtons
                  style={{
                    layout: "vertical",
                    shape: "pill",
                    label: "paypal",
                    height: 44,
                  }}
                  disabled={phase === "paying"}
                  createOrder={handleCreateOrder}
                  onApprove={handleApprove}
                  onError={(err) => {
                    setError(err?.message ?? "PayPal devolvió un error");
                    setPhase("idle");
                  }}
                  onCancel={() => setPhase("idle")}
                />
              ) : (
                <p className="text-error text-sm text-center">
                  Falta VITE_PAYPAL_CLIENT_ID en el .env del frontend.
                </p>
              )}

              <button
                type="button"
                onClick={handleDemoOpen}
                disabled={phase === "paying"}
                className="btn-ghost text-xs text-white/50 hover:text-white/80"
              >
                {phase === "paying"
                  ? "Procesando…"
                  : "Probar sin pagar (modo demo)"}
              </button>
            </div>
            <p className="text-white/40 text-xs">
              Pagos en sandbox: usa una cuenta de prueba PayPal Sandbox.
            </p>
          </motion.section>
        )}

        {phase === "opening" && (
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
              transition={{
                duration: 1.05,
                times: [0, 0.15, 0.3, 0.45, 0.6, 0.85, 1],
              }}
            />
            <p className="text-white/60 text-sm">Abriendo sobre…</p>
          </motion.div>
        )}

        {phase === "revealed" && (
          <motion.section
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <p className="text-xs text-white/45 mb-4 text-center">
              Haz click en una carta para voltearla · Vuelve a hacer click para
              verla en grande
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 w-full max-w-[680px] mx-auto bp-perspective">
              {cards.map((card, idx) => {
                const high = isHighRarity(card);
                const legendary = LEGENDARY_RARITIES.has(
                  card.rarityLabel ?? "",
                );
                const isFlipped = flipped.has(card.tcgId);
                return (
                  <motion.div
                    key={card.tcgId}
                    initial={{ opacity: 0, y: 50, rotate: -5 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{
                      delay: 0.08 * idx,
                      duration: 0.5,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative"
                  >
                    <div
                      className={`bp-flip-card ${isFlipped ? "is-flipped" : ""}`}
                      onClick={() => {
                        if (!isFlipped) handleFlip(card.tcgId);
                        else setZoomed(card);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (!isFlipped) handleFlip(card.tcgId);
                          else setZoomed(card);
                        }
                      }}
                      aria-label={
                        isFlipped
                          ? `Ver ${card.name} en grande`
                          : `Voltear carta ${card.name}`
                      }
                    >
                      <div className="bp-flip-face">
                        <div className="bp-card-back" />
                      </div>
                      <div
                        className={`bp-flip-face bp-flip-back ${high ? "bp-holo" : ""} ${legendary ? "bp-holo-legendary" : ""}`}
                      >
                        {card.imageUrl ? (
                          <img
                            className="bp-card-front-img"
                            src={card.imageUrl}
                            alt={card.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="bp-card-skeleton w-full h-full" />
                        )}
                      </div>
                    </div>

                    {isFlipped && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-2 text-center"
                      >
                        <p className="font-display font-semibold text-white truncate text-xs">
                          {card.name}
                        </p>
                        <div
                          className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${rarityBadgeClass(card.rarityLabel)}`}
                        >
                          {card.rarityLabel ?? "Sin clasificar"}
                        </div>
                        <p className="text-[9px] text-white/35 mt-1">
                          toca para ver en grande
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
              <button type="button" onClick={flipAll} className="btn-secondary">
                Voltear todas
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-primary"
              >
                Comprar otro sobre
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {zoomed && (
          <CardZoomModal card={zoomed} onClose={() => setZoomed(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
