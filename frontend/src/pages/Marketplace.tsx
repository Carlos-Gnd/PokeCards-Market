// ── frontend/src/pages/Marketplace.tsx ───────────────────────────────────────
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { fetchCatalogAll } from "../services/cards.service"; // usa cache
import { Card } from "../components/card";
import { FullscreenLoader } from "../components/ui/Spinner";
import { useAuthStore } from "../store/authStore";
import { useCollectionStore } from "../store/collectionStore";
import { useDebounce } from "../hooks/useDebounce";
import { cn } from "../lib/utils";
import type { ArcadiumCard } from "../types";

// Lazy-load del modal: Framer Motion + PayPal se cargan solo al abrirlo
const CardDetailModal = lazy(() =>
  import("../components/CardDetailModal").then((module) => ({
    default: module.CardDetailModal,
  })),
);

// Nombres amigables para las expansiones
const SET_NAMES: Record<string, string> = {
  base1: "Base Set",
  base3: "Fossil",
  sv3: "Obsidian Flames",
  sv3pt5: "Pokémon 151",
  sv4pt5: "Paldean Fates",
  sv8: "Surging Sparks",
  sv8pt5: "Prismatic Evolutions",
  swsh7: "Evolving Skies",
  swsh12pt5: "Crown Zenith",
};

const RARITY_OPTIONS = [
  "core",
  "alloy",
  "prime",
  "elite",
  "apex",
  "ascendant",
  "eternal",
] as const;

const SORT_OPTIONS = [
  { v: "rarity-desc", label: "Rareza (mayor)" },
  { v: "rarity-asc", label: "Rareza (menor)" },
  { v: "price-desc", label: "Precio (mayor)" },
  { v: "price-asc", label: "Precio (menor)" },
  { v: "name-asc", label: "Nombre (A-Z)" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["v"];

const RARITY_ORDER: Record<string, number> = {
  eternal: 7,
  ascendant: 6,
  apex: 5,
  elite: 4,
  prime: 3,
  alloy: 2,
  core: 1,
};

// ── Cuántas columnas hay según el ancho del viewport ─────────────────────────
function useColumnCount(): number {
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1536) setCols(6);
      else if (w >= 1280) setCols(5);
      else if (w >= 1024) setCols(4);
      else if (w >= 640) setCols(3);
      else setCols(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

// ── Altura estimada de cada fila del grid (card + gap vertical) ───────────────
const CARD_HEIGHT = 320; // px — altura de la carta
const ROW_GAP = 28; // px — equivale a gap-y-7 (7 * 4 = 28)
const CARD_ROW_HEIGHT = CARD_HEIGHT + ROW_GAP;

export function MarketplacePage() {
  const { user } = useAuthStore();
  const { ownedIds, fetch: fetchCollection } = useCollectionStore();

  const [cards, setCards] = useState<ArcadiumCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros
  const [searchInput, setSearchInput] = useState("");
  const [rarities, setRarities] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [sets, setSets] = useState<Set<string>>(new Set()); // NUEVO: Filtro de expansiones
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<SortValue>("rarity-desc");
  const [selected, setSelected] = useState<ArcadiumCard | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Debounce: el filtro de nombre solo recalcula 300 ms después ──────────
  const search = useDebounce(searchInput, 300);

  const cols = useColumnCount();
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Carga inicial (usa cache de sessionStorage) ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetchCatalogAll()
      .then((data) => {
        if (!cancelled) setCards(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            err &&
            typeof err === "object" &&
            "uiMessage" in err &&
            typeof (err as { uiMessage: unknown }).uiMessage === "string"
              ? (err as { uiMessage: string }).uiMessage
              : "No se pudo cargar el catálogo";
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user) fetchCollection();
  }, [user, fetchCollection]);

  // ── Lista de tipos disponibles ───────────────────────────────────────────
  const allTypes = useMemo(() => {
    const s = new Set<string>();
    cards.forEach((c) => {
      s.add(c.type);
      if (c.secondaryType) s.add(c.secondaryType);
    });
    return Array.from(s).sort();
  }, [cards]);

  // ── Lista de Expansiones disponibles ─────────────────────────────────────
  const allSets = useMemo(() => {
    const s = new Set<string>();
    cards.forEach((c) => {
      if (c.setId) s.add(c.setId);
    });
    // Ordenar alfabéticamente por el nombre amigable
    return Array.from(s).sort((a, b) =>
      (SET_NAMES[a] || a).localeCompare(SET_NAMES[b] || b),
    );
  }, [cards]);

  // ── Filtrado (depende del search DEBOUNCED) ──────────────────────────────
  const filtered = useMemo(() => {
    let out = cards;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (rarities.size) out = out.filter((c) => rarities.has(c.rarity));
    if (types.size)
      out = out.filter(
        (c) =>
          types.has(c.type) || (c.secondaryType && types.has(c.secondaryType)),
      );
    if (sets.size) out = out.filter((c) => sets.has(c.setId)); // Aplicar filtro de expansión
    if (onlyAvailable) out = out.filter((c) => !ownedIds.has(c.tcgId));
    return out;
  }, [cards, search, rarities, types, sets, onlyAvailable, ownedIds]);

  // ── Ordenado (memo separado para no re-clonar al filtrar) ───────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "rarity-desc":
          return (
            (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0) ||
            b.marketPrice - a.marketPrice
          );
        case "rarity-asc":
          return (RARITY_ORDER[a.rarity] ?? 0) - (RARITY_ORDER[b.rarity] ?? 0);
        case "price-desc":
          return b.marketPrice - a.marketPrice;
        case "price-asc":
          return a.marketPrice - b.marketPrice;
        case "name-asc":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [filtered, sort]);

  // ── Agrupar cards en filas para el virtualizador ─────────────────────────
  const rows = useMemo(() => {
    const result: ArcadiumCard[][] = [];
    for (let i = 0; i < sorted.length; i += cols) {
      result.push(sorted.slice(i, i + cols));
    }
    return result;
  }, [sorted, cols]);

  // ── Virtualizador de filas ───────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_ROW_HEIGHT,
    overscan: 3,
  });

  const toggleSet = (
    set: Set<string>,
    value: string,
    setter: (s: Set<string>) => void,
  ) => {
    const next = new Set(set);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    setter(next);
  };

  const clearFilters = () => {
    setSearchInput("");
    setRarities(new Set());
    setTypes(new Set());
    setSets(new Set());
    setOnlyAvailable(false);
    setSort("rarity-desc");
  };

  const activeFilters =
    rarities.size +
    types.size +
    sets.size +
    (onlyAvailable ? 1 : 0) +
    (searchInput ? 1 : 0);

  if (loading)
    return <FullscreenLoader label="Cargando catálogo desde PokéAPI…" />;
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display font-bold text-2xl mb-2">
          No pudimos cargar el catálogo
        </h2>
        <p className="text-white/55 mb-6">{error}</p>
        <p className="text-xs text-white/40">
          Revisa la conexión de red o contacta a soporte.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-10">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-primary/80 mb-2">
          Marketplace
        </p>
        <h1 className="font-display font-black text-3xl lg:text-4xl mb-1">
          Catálogo de Cartas
        </h1>
        <p className="text-sm text-white/55">
          {cards.length} cartas dinámicas · Datos desde PokéAPI · Rarezas
          determinísticas
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            placeholder="Buscar Pokémon por nombre…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            className="input min-w-[200px]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "btn-secondary relative",
              activeFilters > 0 && "border-primary/40",
            )}
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
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8 p-5 rounded-2xl glass space-y-5 overflow-hidden"
        >
          {/* Expansión */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-2">
              Expansión
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allSets.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSet(sets, s, setSets)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    sets.has(s)
                      ? "bg-secondary/20 border-secondary/60 text-white"
                      : "bg-white/[0.03] border-white/10 text-white/65 hover:bg-white/[0.06]",
                  )}
                >
                  {SET_NAMES[s] || s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Rareza */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-2">
                Rareza
              </p>
              <div className="flex flex-wrap gap-1.5">
                {RARITY_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => toggleSet(rarities, r, setRarities)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all",
                      rarities.has(r)
                        ? "bg-primary/20 border-primary/60 text-white"
                        : "bg-white/[0.03] border-white/10 text-white/65 hover:bg-white/[0.06]",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-2">
                Tipo
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleSet(types, t, setTypes)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      types.has(t)
                        ? "bg-accent/20 border-accent/60 text-white"
                        : "bg-white/[0.03] border-white/10 text-white/65 hover:bg-white/[0.06]",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
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
                <span className="text-sm text-white/75">
                  Solo cartas que aún no tengo
                </span>
              </label>
            )}
            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="btn-ghost text-xs ml-auto"
              >
                <X size={14} /> Limpiar filtros
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Resultados */}
      {sorted.length === 0 ? (
        <div className="text-center py-20 text-white/50">
          <p className="font-display font-bold text-xl mb-2">
            No hay cartas con esos filtros
          </p>
          <button onClick={clearFilters} className="btn-secondary">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-white/45 mb-4">
            Mostrando{" "}
            <span className="text-white/80 font-mono">{sorted.length}</span> de{" "}
            {cards.length} cartas
          </p>

          <div
            ref={scrollRef}
            style={{ height: "80vh", overflowY: "auto" }}
            className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
          >
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const rowCards = rows[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: virtualRow.start,
                      left: 0,
                      width: "100%",
                      height: CARD_HEIGHT,
                      paddingBottom: ROW_GAP,
                      boxSizing: "content-box",
                      display: "grid",
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                      gap: "0 1rem",
                    }}
                  >
                    {rowCards.map((card) => (
                      <div
                        key={card.tcgId}
                        className="w-full max-w-[180px] sm:max-w-[210px] xl:max-w-[240px] justify-self-center"
                      >
                        <Card
                          card={card}
                          owned={ownedIds.has(card.tcgId)}
                          onClick={() => setSelected(card)}
                          size="sm"
                          enableTilt={false}
                          lightweight
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Suspense fallback={null}>
        <CardDetailModal
          card={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          owned={selected ? ownedIds.has(selected.tcgId) : false}
        />
      </Suspense>
    </div>
  );
}
