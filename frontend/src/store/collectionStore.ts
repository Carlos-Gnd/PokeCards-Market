import { create } from 'zustand';
import type { UserCardEntry } from '../types';
import { api } from '../lib/api';

interface CollectionState {
  items: UserCardEntry[];
  ownedIds: Set<string>;
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
    set({ loading: true });
    try {
      // Usa el endpoint NestJS /api/collection (requiere Bearer token,
      // que el interceptor de `api` adjunta automáticamente desde Supabase).
      const { data } = await api.get<UserCardEntry[]>('/collection');
      const items = Array.isArray(data) ? data : [];
      set({
        items,
        ownedIds: new Set(items.map((e) => e.card.tcgId).filter(Boolean) as string[]),
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
    if (entry.card.tcgId) next.add(entry.card.tcgId);
    const exists = items.find((i) => i.card.tcgId === entry.card.tcgId);
    if (exists) {
      set({
        items: items.map((i) =>
          i.card.tcgId === entry.card.tcgId
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        ),
        ownedIds: next,
      });
    } else {
      set({ items: [entry, ...items], ownedIds: next });
    }
  },

  reset: () => set({ items: [], ownedIds: new Set<string>() }),
}));
