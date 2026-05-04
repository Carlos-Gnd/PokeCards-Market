import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PayPalButtons } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';
import { Lock, ShieldCheck, Sparkles, Heart, Swords, Wind, type LucideIcon } from 'lucide-react';
import { Modal } from './ui/Modal';
import { TypeBadge } from './ui/TypeBadge';
import { Spinner } from './ui/Spinner';
import { Card } from './card';
import { getTheme } from './card/rarity-themes';
import { formatPrice } from '../lib/utils';
import { VARIANT_LABEL } from '../lib/rarity';
import { useAuthStore } from '../store/authStore';
import { useCollectionStore } from '../store/collectionStore';
import { createOrder, captureOrder } from '../services/payments.service';
import type { ArcadiumCard } from '../types';

interface Props {
  card: ArcadiumCard | null;
  open: boolean;
  onClose: () => void;
  owned?: boolean;
}

function getUiMessage(err: unknown, fallback: string) {
  return err && typeof err === 'object' && 'uiMessage' in err && typeof err.uiMessage === 'string'
    ? err.uiMessage
    : fallback;
}

export function CardDetailModal({ card, open, onClose, owned }: Props) {
  const { user } = useAuthStore();
  const { add } = useCollectionStore();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  if (!card) return null;
  const theme = getTheme(card.rarity);

  // BUG FIX: Detectar si los stats están disponibles (vienen del catálogo)
  // o si son los valores vacíos que se usan en CollectionVault
  const hasStats = card.stats && (
    card.stats.hp > 0 ||
    card.stats.attack > 0 ||
    card.stats.defense > 0 ||
    card.stats.speed > 0
  );

  const handleClose = () => {
    setUnlocked(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} size="lg" className="max-w-[1320px] max-h-[94vh] lg:aspect-[21/9] overflow-y-auto">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(300px,1fr)] gap-0">
        {/* Carta interactiva grande */}
        <div className="relative px-5 py-8 sm:p-8 lg:p-8 flex items-center justify-center min-h-[520px] lg:min-h-0">
          <div className="absolute inset-0 opacity-50 pointer-events-none">
            <div
              className="absolute inset-0 blur-[80px]"
              style={{ background: `radial-gradient(circle at 50% 40%, ${theme.accentColor}40, transparent 60%)` }}
            />
          </div>
          <motion.div
            key={`${card.tcgId}-${unlocked}`}
            initial={unlocked ? { scale: 0.5, rotate: -8, opacity: 0 } : { scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
            className="relative w-full max-w-[380px]"
          >
            <Card card={card} size="xl" enableTilt />
          </motion.div>
        </div>

        {/* Detalles */}
        <div className="px-5 pb-6 sm:px-8 lg:p-8 lg:pl-5 space-y-4">
          <div className="space-y-2 lg:pt-8">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[10px] uppercase tracking-[0.18em] font-display font-bold"
                style={{
                  borderColor: theme.accentColor + '66',
                  backgroundColor: theme.accentColor + '20',
                  color: theme.accentColor,
                }}
              >
                {theme.label}
              </span>
              <span
                className="text-[11px] uppercase tracking-[0.18em] font-bold"
                style={{ color: theme.metaColor }}
              >
                {VARIANT_LABEL[card.variant] ?? card.variant}
              </span>
            </div>
            <h2 className="font-display font-black text-3xl leading-tight" style={{ color: theme.nameColor }}>
              {card.name}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <TypeBadge type={card.type} />
              {card.secondaryType && <TypeBadge type={card.secondaryType} />}
            </div>
          </div>

          {/* Stats — solo si están disponibles */}
          {hasStats ? (
            <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
              <StatBox icon={Heart} label="HP" value={card.stats.hp} color="text-rose-400" />
              <StatBox icon={Swords} label="Ataque" value={card.stats.attack} color="text-orange-400" />
              <StatBox icon={ShieldCheck} label="Defensa" value={card.stats.defense} color="text-blue-400" />
              <StatBox icon={Wind} label="Velocidad" value={card.stats.speed} color="text-emerald-400" />
            </div>
          ) : (
            /*
              BUG FIX: Cuando la carta viene de CollectionVault (express-api),
              los stats son 0 porque no se almacenan. En lugar de mostrar
              "HP: 0, Ataque: 0..." (datos falsos), se indica que no están disponibles.
            */
            <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/40 text-center">
              Stats no disponibles para esta carta
            </div>
          )}

          {card.abilities.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-1.5">Habilidades</p>
              <div className="flex flex-wrap gap-1.5">
                {card.abilities.map((ab) => (
                  <span key={ab} className="text-xs px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-white/75">
                    {ab}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Precio + CTA */}
          <div className="pt-3 border-t border-white/[0.06]">
            <div className="flex items-end justify-between gap-3 mb-3">
              <span className="text-xs uppercase tracking-wider text-white/50">Precio de mercado</span>
              <span className="font-display font-black text-2xl" style={{ color: theme.accentColor }}>
                {formatPrice(card.marketPrice)}
              </span>
            </div>

            {owned ? (
              <div className="rounded-xl bg-success/10 border border-success/30 p-4 flex items-center gap-3 text-success">
                <ShieldCheck size={22} />
                <div>
                  <p className="font-semibold">Esta carta ya está en tu colección</p>
                  <button
                    onClick={() => { handleClose(); navigate('/collection'); }}
                    className="text-xs underline hover:text-white"
                  >
                    Ver mi colección →
                  </button>
                </div>
              </div>
            ) : !user ? (
              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/70">
                <p className="mb-2 inline-flex items-center gap-2"><Lock size={14} /> Inicia sesión para comprar</p>
                <button onClick={() => { handleClose(); navigate('/login'); }} className="btn-primary w-full">
                  Iniciar sesión
                </button>
              </div>
            ) : processing ? (
              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-6 flex flex-col items-center gap-2">
                <Spinner size={32} />
                <p className="text-sm text-white/70">Procesando pago…</p>
              </div>
            ) : (
              <div className="space-y-2">
                <PayPalButtons
                  style={{ layout: 'horizontal', shape: 'rect', label: 'paypal', color: 'gold', height: 45, tagline: false }}
                  fundingSource="paypal"
                  forceReRender={[card.tcgId, card.marketPrice]}
                  createOrder={async () => {
                    try {
                      const r = await createOrder(card.tcgId);
                      return r.paypalOrderId;
                    } catch (err: unknown) {
                      toast.error(getUiMessage(err, 'No se pudo crear la orden'));
                      throw err;
                    }
                  }}
                  onApprove={async (data) => {
                    /*
                      BUG FIX: `data.orderID` puede ser undefined según los tipos
                      de @paypal/react-paypal-js. El non-null assertion `data.orderID!`
                      causaba un error de runtime si PayPal devolvía una respuesta
                      inesperada. Se usa el operador nullish coalescing como fallback seguro.
                    */
                    const orderId = data.orderID ?? '';
                    if (!orderId) {
                      toast.error('No se recibió el ID de orden de PayPal');
                      return;
                    }

                    setProcessing(true);
                    try {
                      const res = await captureOrder(orderId);
                      if (res.alreadyCaptured && res.userCard) {
                        add(res.userCard);
                        toast.success('Esta orden ya estaba capturada — carta confirmada en tu colección');
                      } else if (res.success && res.userCard) {
                        add(res.userCard);
                        setUnlocked(true);
                        toast.success(
                          `¡${card.name} desbloqueada! (${theme.label})`,
                          { duration: 4500, icon: '✨' },
                        );
                      } else {
                        toast.error('El pago no se completó');
                      }
                    } catch (err: unknown) {
                      toast.error(getUiMessage(err, 'La compra falló'));
                    } finally {
                      setProcessing(false);
                    }
                  }}
                  onCancel={() => toast('Pago cancelado', { icon: '⚠️' })}
                  onError={(err) => {
                    console.error(err);
                    toast.error('Error en PayPal');
                  }}
                />
                <p className="text-[10px] text-white/40 text-center inline-flex items-center justify-center gap-1 w-full">
                  <ShieldCheck size={11} /> Pago procesado por PayPal Sandbox · No se hacen cargos reales
                </p>
              </div>
            )}

            {unlocked && !owned && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl bg-gradient-to-r from-success/15 to-primary/15 border border-success/30 p-4 text-center"
              >
                <Sparkles size={22} className="text-gold mx-auto mb-1" />
                <p className="font-display font-bold">¡Carta añadida a tu colección!</p>
                <button
                  onClick={() => { handleClose(); navigate('/collection'); }}
                  className="text-xs underline text-white/80 hover:text-white mt-1"
                >
                  Ver mi colección →
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function StatBox({
  icon: Icon, label, value, color,
}: { icon: LucideIcon; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <Icon size={18} className={color} />
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-wider text-white/45">{label}</div>
        <div className="font-mono font-bold text-base">{value}</div>
      </div>
    </div>
  );
}
