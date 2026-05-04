// CollectionVaultPage.tsx - Página de bóveda de colección del usuario

import { useEffect, useMemo, useState, lazy, Suspense, useCallback, type ComponentType } from 'react';
import { motion } from 'framer-motion';
import { Library, Sparkles, TrendingUp } from 'lucide-react';
import { useCollectionStore } from '../store/collectionStore';
import { Card } from '../components/card';
import { FullscreenLoader } from '../components/ui/Spinner';
import { Link } from 'react-router-dom';
import { cn, formatPrice } from '../lib/utils';
import { fetchCatalogAll } from '../services/cards.service';
import type { ArcadiumCard } from '../types';

const CardDetailModal = lazy(() =>
  import("../components/CardDetailModal").then((module) => ({
    default: module.CardDetailModal,
  }))
);

const RARITY_ORDER: Record<string, number> = {
  eternal: 7, ascendant: 6, apex: 5, elite: 4, prime: 3, alloy: 2, core: 1,
};

export function CollectionVaultPage() {
  const { items, loading, fetch } = useCollectionStore();
  const [tab, setTab] = useState<'all' | 'rare' | 'recent'>('all');
  const [selected, setSelected] = useState<ArcadiumCard | null>(null);

  /*
    FIX BUG 5 (Stats no disponibles):
    CollectionVault construye ArcadiumCard con stats: { hp:0, attack:0, defense:0, speed:0 }
    porque el endpoint de colección no devuelve stats de PokeAPI.
    
    Solución: cuando el usuario hace click en una carta de la colección,
    buscamos en el catálogo completo (que sí tiene stats) por tcgId y usamos
    esos datos para abrir el modal. Si no encontramos la carta en el catálogo
    (caso edge), usamos los datos de la colección sin stats.
    
    El catálogo ya tiene cache en sessionStorage (fetchCatalogAll), así que
    esta búsqueda es instantánea en la segunda visita.
  */
  const [catalogCache, setCatalogCache] = useState<Map<string, ArcadiumCard>>(new Map());

  useEffect(() => { fetch(); }, [fetch]);

  // Pre-cargar catálogo en background para tener stats disponibles
  useEffect(() => {
    fetchCatalogAll()
      .then((data) => {
        const map = new Map<string, ArcadiumCard>();
        data.forEach((c) => map.set(c.tcgId, c));
        setCatalogCache(map);
      })
      .catch(() => {
        // Si falla, se usa el fallback sin stats (comportamiento anterior)
      });
  }, []);

  const handleCardClick = useCallback((card: ArcadiumCard) => {
    // Intentar usar la versión con stats del catálogo
    const catalogCard = catalogCache.get(card.tcgId);
    setSelected(catalogCard ?? card);
  }, [catalogCache]);

  const totalValue = useMemo(
    () => items.reduce((acc, e) => acc + e.card.marketPrice * e.quantity, 0),
    [items],
  );
  const rareCount = items.filter((e) => (RARITY_ORDER[e.card.rarity] ?? 0) >= 4).length;

  const filtered = useMemo(() => {
    let out = items;
    if (tab === 'rare') out = items.filter((e) => (RARITY_ORDER[e.card.rarity] ?? 0) >= 4);
    if (tab === 'recent') out = [...items].slice(0, 12);
    return out;
  }, [items, tab]);

  if (loading) return <FullscreenLoader label="Abriendo tu bóveda…" />;

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Library size={16} className="text-primary" />
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80">Collection Vault</p>
        </div>
        <h1 className="font-display font-black text-4xl lg:text-5xl mb-2">Mi colección</h1>
        <p className="text-white/55">Cartas desbloqueadas tras pago verificado</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Library} label="Cartas únicas" value={items.length.toString()} hint={`${items.reduce((a, e) => a + e.quantity, 0)} totales`} />
        <StatCard icon={TrendingUp} label="Valor de bóveda" value={formatPrice(totalValue)} hint="Suma de mercado" />
        <StatCard icon={Sparkles} label="Cartas raras" value={rareCount.toString()} hint="Elite, Apex, Ascendant, Eternal" />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24 rounded-2xl glass">
          <Library size={42} className="text-white/30 mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl mb-2">Tu bóveda está vacía</h2>
          <p className="text-white/55 mb-6 max-w-md mx-auto">
            Empieza tu colección comprando cartas en el marketplace. Cada carta que adquieras quedará registrada aquí.
          </p>
          <Link to="/marketplace" className="btn-primary">Explorar Marketplace</Link>
        </div>
      ) : (
        <>
          <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
            {[
              { id: 'all' as const, label: `Todas (${items.length})` },
              { id: 'rare' as const, label: `Raras (${rareCount})` },
              { id: 'recent' as const, label: 'Recientes' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  tab === t.id ? 'bg-primary/20 text-white' : 'text-white/60 hover:text-white',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-7 sm:gap-x-5 lg:gap-x-6 lg:gap-y-8 pt-6">
            {filtered.map((entry, idx) => {
              const card: ArcadiumCard = {
                pokemonId: entry.card.pokemonId,
                tcgId: entry.card.tcgId ?? `legacy-${entry.card.pokemonId}`,
                name: entry.card.name,
                type: entry.card.type,
                secondaryType: entry.card.secondaryType,
                rarity: entry.card.rarity,
                rarityLabel: entry.card.rarity,
                variant: entry.card.variant,
                imageUrl: entry.card.imageUrl,
                marketPrice: entry.card.marketPrice,
                // Stats vacíos — se sustituyen por los del catálogo en handleCardClick
                stats: { hp: 0, attack: 0, defense: 0, speed: 0 },
                height: 0,
                weight: 0,
                abilities: [],
              };

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.4) }}
                  className="relative w-full max-w-[170px] sm:max-w-[200px] xl:max-w-[220px] justify-self-center"
                >
                  <Card card={card} owned onClick={() => handleCardClick(card)} size="sm" />
                  {entry.quantity > 1 && (
                    <span className="absolute -top-2 -right-2 z-30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary text-white border border-white/20 shadow-lg">
                      x{entry.quantity}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      <Suspense fallback={null}>
        <CardDetailModal
          card={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          owned
        />
      </Suspense>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, hint,
}: { icon: ComponentType<{ size?: number; className?: string }>; label: string; value: string; hint: string }) {
  return (
    <div className="p-5 rounded-2xl glass">
      <Icon size={20} className="text-primary mb-2" />
      <p className="text-xs uppercase tracking-wider text-white/45 mb-1">{label}</p>
      <p className="font-display font-black text-2xl">{value}</p>
      <p className="text-[11px] text-white/40 mt-1">{hint}</p>
    </div>
  );
}
