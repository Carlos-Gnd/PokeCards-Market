// ── frontend/src/services/cards.service.ts ───────────────────────────────────
import { api } from '../lib/api';
import type { ArcadiumCard } from '../types';

const CATALOG_CACHE_KEY = 'arcadium_catalog_v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export interface CatalogParams {
  page?: number;
  limit?: number;
  rarity?: string;
  type?: string;
  search?: string;
  sort?: string;
}

export interface CatalogResponse {
  count: number;
  page: number;
  limit: number;
  totalPages: number;
  cards: ArcadiumCard[];
}

// ── Cache en sessionStorage ───────────────────────────────────────────────────
function getCached(key: string): ArcadiumCard[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: ArcadiumCard[]; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) { sessionStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function setCached(key: string, data: ArcadiumCard[]): void {
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); }
  catch { /* cuota excedida — ignorar */ }
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Catálogo con paginación y filtros server-side.
 * Si `page` no se pasa, devuelve la página 1 (48 cartas).
 */
export async function fetchCatalog(
  params: CatalogParams = {},
): Promise<CatalogResponse> {
  const { data } = await api.get<CatalogResponse>('/cards', { params });
  return data ?? { count: 0, page: 1, limit: 48, totalPages: 0, cards: [] };
}

/**
 * Catálogo completo en una sola llamada (para compatibilidad con código
 * existente que no usa paginación todavía). Usa cache de sessionStorage.
 */
export async function fetchCatalogAll(): Promise<ArcadiumCard[]> {
  const cached = getCached(CATALOG_CACHE_KEY);
  if (cached) return cached;

  // Carga en lotes paralelos de 48 cartas hasta tener el total
  const first = await fetchCatalog({ limit: 48, page: 1 });
  let cards = first.cards;

  if (first.totalPages > 1) {
    const pages = Array.from({ length: first.totalPages - 1 }, (_, i) => i + 2);
    const rest = await Promise.all(pages.map((p) => fetchCatalog({ limit: 48, page: p })));
    cards = cards.concat(rest.flatMap((r) => r.cards));
  }

  setCached(CATALOG_CACHE_KEY, cards);
  return cards;
}

export async function fetchTrending(): Promise<ArcadiumCard[]> {
  const { data } = await api.get<{ cards: ArcadiumCard[] }>('/cards/trending');
  return data.cards ?? [];
}

export async function fetchOne(tcgId: string): Promise<ArcadiumCard> {
  const { data } = await api.get<ArcadiumCard>(`/cards/${tcgId}`);
  return data;
}
