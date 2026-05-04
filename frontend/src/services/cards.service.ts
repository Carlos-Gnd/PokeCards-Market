import { api } from '../lib/api';
import type { ArcadiumCard } from '../types';

export async function fetchCatalog(): Promise<ArcadiumCard[]> {
  const { data } = await api.get<{ count: number; cards: ArcadiumCard[] }>('/cards');
  return data?.cards || []; 
}

export async function fetchTrending(): Promise<ArcadiumCard[]> {
  const { data } = await api.get<{ cards: ArcadiumCard[] }>('/cards/trending');
  return data.cards ?? [];
}

export async function fetchOne(tcgId: string): Promise<ArcadiumCard> {
  const { data } = await api.get<ArcadiumCard>(`/cards/${tcgId}`);
  return data;
}
