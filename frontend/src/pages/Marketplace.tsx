import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { fetchCatalog } from '../services/cards.service';
import { Card } from '../components/card';
import { CardDetailModal } from '../components/CardDetailModal';
import { FullscreenLoader } from '../components/ui/Spinner';
import { useAuthStore } from '../store/authStore';
import { useCollectionStore } from '../store/collectionStore';
import { cn } from '../lib/utils';
import type { ArcadiumCard } from '../types';

const RARITY_OPTIONS = ['core', 'alloy', 'prime', 'elite', 'apex', 'ascendant', 'eternal'] as const;
const SORT_OPTIONS = [
  { v: 'rarity-desc', label: 'Rareza (mayor)' },
  { v: 'rarity-asc', label: 'Rareza (menor)' },
  { v: 'price-desc', label: 'Precio (mayor)' },
  { v: 'price-asc', label: 'Precio (menor)' },
  { v: 'name-asc', label: 'Nombre (A-Z)' },
] as const;

const RARITY_ORDER: Record<string, number> = {
  eternal: 7, ascendant: 6, apex: 5, elite: 4, prime: 3, alloy: 2, core: 1,
};

export function MarketplacePage() {
  const { user } = useAuthStore();
  const { ownedIds, fetch: fetchCollection } = useCollectionStore();
  const [cards, setCards] = useState<ArcadiumCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rarities, setRarities] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<typeof SORT_OPTIONS[number]['v']>('rarity-desc');
  const [selected, setSelected] = useState<ArcadiumCard | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchCatalog()
      .then((data) => setCards(data))
      .catch((err) => setError(err?.uiMessage || 'No se pudo cargar el catálogo'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) fetchCollection();
  }, [user, fetchCollection]);

  const allTypes = useMemo(() => {
    const s = new Set<string>();
    cards.forEach((c) => { s.add(c.type); if (c.secondaryType) s.add(c.secondaryType); });
    return Array.from(s).sort();
  }, [cards]);

  const filtered = useMemo(() => {
    let out = cards;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (rarities.size) out = out.filter((c) => rarities.has(c.rarity));
    if (types.size) out = out.filter((c) => types.has(c.type) || (c.secondaryType && types.has(c.secondaryType)));
    if (onlyAvailable) out = out.filter((c) => !ownedIds.has(c.pokemonId));
    out = [...out].sort((a, b) => {
      switch (sort) {
        case 'rarity-desc': return (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0) || b.marketPrice - a.marketPrice;
        case 'rarity-asc':  return (RARITY_ORDER[a.rarity] ?? 0) - (RARITY_ORDER[b.rarity] ?? 0);
        case 'price-desc':  return b.marketPrice - a.marketPrice;
        case 'price-asc':   return a.marketPrice - b.marketPrice;
        case 'name-asc':    return a.name.localeCompare(b.name);
      }
    });
    return out;
  }, [cards, search, rarities, types, onlyAvailable, sort, ownedIds]);

  const toggleSet = (set: Set<string>, value: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  };

  const clearFilters = () => {
    setSearch('');
    setRarities(new Set());
    setTypes(new Set());
    setOnlyAvailable(false);
    setSort('rarity-desc');
  };

  const activeFilters = rarities.size + types.size + (onlyAvailable ? 1 : 0) + (search ? 1 : 0);

  if (loading) return <FullscreenLoader label="Cargando catálogo desde PokéAPI…" />;
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display font-bold text-2xl mb-2">No pudimos cargar el catálogo</h2>
        <p className="text-white/55 mb-6">{error}</p>
        <p className="text-xs text-white/40">Asegúrate de que el backend está corriendo en <code className="font-mono text-primary">localhost:3000</code></p>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.25em] text-primary/80 mb-2">Marketplace</p>
        <h1 className="font-display font-black text-3xl lg:text-4xl mb-1">Catálogo de Cartas</h1>
        <p className="text-sm text-white/55">{cards.length} cartas dinámicas · Datos desde PokéAPI · Rarezas determinísticas</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="input min-w-[200px]"
          >
            {SORT_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn('btn-secondary relative', activeFilters > 0 && 'border-primary/40')}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilters > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                {activeFilters}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filtros expandibles */}
      {filtersOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8 p-5 rounded-2xl glass space-y-4 overflow-hidden"
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-2">Rareza</p>
            <div className="flex flex-wrap gap-1.5">
              {RARITY_OPTIONS.map((r) => {
                const active = rarities.has(r);
                return (
                  <button
                    key={r}
                    onClick={() => toggleSet(rarities, r, setRarities)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all',
                      active
                        ? 'bg-primary/20 border-primary/60 text-white'
                        : 'bg-white/[0.03] border-white/10 text-white/65 hover:bg-white/[0.06]',
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-2">Tipo</p>
            <div className="flex flex-wrap gap-1.5">
              {allTypes.map((t) => {
                const active = types.has(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleSet(types, t, setTypes)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      active ? 'bg-accent/20 border-accent/60 text-white' : 'bg-white/[0.03] border-white/10 text-white/65 hover:bg-white/[0.06]',
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/[0.06]">
            {user && (
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-white/75">Solo cartas que aún no tengo</span>
              </label>
            )}
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="btn-ghost text-xs ml-auto">
                <X size={14} /> Limpiar filtros
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-white/50">
          <p className="font-display font-bold text-xl mb-2">No hay cartas con esos filtros</p>
          <button onClick={clearFilters} className="btn-secondary">Limpiar filtros</button>
        </div>
      ) : (
        <>
          <p className="text-xs text-white/45 mb-4">
            Mostrando <span className="text-white/80 font-mono">{filtered.length}</span> de {cards.length} cartas
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-5 justify-items-center pt-3">
            {filtered.map((card) => (
              <div
                key={card.pokemonId}
                className="w-full max-w-[170px]"
              >
                <Card
                  card={card}
                  owned={ownedIds.has(card.pokemonId)}
                  onClick={() => setSelected(card)}
                  size="sm"
                  enableTilt={false}
                  lightweight
                />
              </div>
            ))}
          </div>
        </>
      )}

      <CardDetailModal
        card={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        owned={selected ? ownedIds.has(selected.pokemonId) : false}
      />
    </div>
  );
}
