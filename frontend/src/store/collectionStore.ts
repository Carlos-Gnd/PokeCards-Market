import { create } from 'zustand';
import type { UserCardEntry } from '../types';
import { useAuthStore } from './authStore';

const BOOSTER_API_URL =
  (import.meta.env.VITE_BOOSTER_API_URL as string | undefined) ?? 'http://localhost:3001';

const RARITY_TO_TIER: Record<string, string> = {
  Common: 'core',
  Uncommon: 'alloy',
  Rare: 'prime',
  'Double Rare': 'elite',
  'Ultra Rare': 'apex',
  'Illustration Rare': 'apex',
  'Special Illustration Rare': 'ascendant',
  'Hyper Rare': 'eternal',
};

interface ExpressCollectionItem {
  cartaId: string;
  fechaAdquisicion: string;
  obtenidaDe: string;
  paypalOrderId: string | null;
  carta: {
    id: string;
    nombre: string;
    pokedexNumero: number | null;
    rareza: string | null;
    tipo: string | null;
    imagenSmall: string | null;
    imagenLarge: string | null;
    precioMercado: number;
  };
}

function pokemonIdFromCardId(cardId: string): number {
  const tail = cardId.split('-').pop();
  const n = tail ? Number.parseInt(tail, 10) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function mapExpressItem(item: ExpressCollectionItem): UserCardEntry {
  const pokemonId = pokemonIdFromCardId(item.cartaId);
  return {
    id: item.cartaId,
    quantity: 1,
    obtainedFrom: item.obtenidaDe,
    acquiredAt: item.fechaAdquisicion,
    card: {
      id: pokemonId,
      pokemonId,
      name: item.carta.nombre,
      type: item.carta.tipo ?? 'Colorless',
      secondaryType: null,
      rarity: (item.carta.rareza && RARITY_TO_TIER[item.carta.rareza]) ?? 'core',
      variant: 'standard',
      imageUrl: item.carta.imagenLarge ?? item.carta.imagenSmall ?? '',
      marketPrice: Number(item.carta.precioMercado),
    },
  };
}

interface CollectionState {
  items: UserCardEntry[];
  ownedIds: Set<number>;
  loading: boolean;
  fetch: () => Promise<void>;
  add: (entry: UserCardEntry) => void;
  reset: () => void;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  items: [],
  ownedIds: new Set(),
  loading: false,

  fetch: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      set({ items: [], ownedIds: new Set(), loading: false });
      return;
    }
    set({ loading: true });
    try {
      const url = `${BOOSTER_API_URL}/api/me/collection?userId=${encodeURIComponent(userId)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { count: number; items: ExpressCollectionItem[] } = await res.json();
      const items = data.items.map(mapExpressItem);
      set({
        items,
        ownedIds: new Set(items.map((e) => e.card.pokemonId)),
        loading: false,
      });
    } catch (err) {
      console.error('[collectionStore] fetch falló:', err);
      set({ loading: false });
    }
  },

  add: (entry) => {
    const { items, ownedIds } = get();
    const next = new Set(ownedIds);
    next.add(entry.card.pokemonId);
    const exists = items.find((i) => i.card.pokemonId === entry.card.pokemonId);
    if (exists) {
      set({
        items: items.map((i) =>
          i.card.pokemonId === entry.card.pokemonId ? { ...i, quantity: i.quantity + 1 } : i,
        ),
        ownedIds: next,
      });
    } else {
      set({ items: [entry, ...items], ownedIds: next });
    }
  },

  reset: () => set({ items: [], ownedIds: new Set() }),
}));
