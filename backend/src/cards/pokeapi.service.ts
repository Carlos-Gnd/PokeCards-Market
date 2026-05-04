import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { variantFor } from './rarity.util';
import type { RarityTier } from './rarity.util';

export interface PokeCard {
  pokemonId: number;
  tcgId: string;
  name: string;
  type: string;
  secondaryType: string | null;
  rarity: string;
  rarityLabel: string;
  variant: string;
  imageUrl: string;
  marketPrice: number;
  stats: { hp: number; attack: number; defense: number; speed: number };
  height: number;
  weight: number;
  abilities: string[];
}

interface CartaPokemonRow {
  id: string;
  nombre: string;
  pokedex_numero: number | null;
  rareza: string | null;
  tipo: string | null;
  imagen_small: string | null;
  imagen_large: string | null;
  precio_mercado: string | number;
}

const RARITY_TO_TIER: Record<string, { tier: RarityTier; label: string }> = {
  // Scarlet & Violet era
  Common: { tier: 'core', label: 'Common' },
  Uncommon: { tier: 'alloy', label: 'Uncommon' },
  Rare: { tier: 'prime', label: 'Rare' },
  'Double Rare': { tier: 'elite', label: 'Double Rare' },
  'Ultra Rare': { tier: 'apex', label: 'Ultra Rare' },
  'Illustration Rare': { tier: 'apex', label: 'Illustration Rare' },
  'Special Illustration Rare': {
    tier: 'ascendant',
    label: 'Special Illustration Rare',
  },
  'Hyper Rare': { tier: 'eternal', label: 'Hyper Rare' },
  // Sword & Shield era
  'Rare Holo': { tier: 'prime', label: 'Rare Holo' },
  'Rare Holo EX': { tier: 'apex', label: 'Rare Holo EX' },
  'Rare Holo GX': { tier: 'apex', label: 'Rare Holo GX' },
  'Rare Holo LV.X': { tier: 'apex', label: 'Rare Holo LV.X' },
  'Rare Holo Star': { tier: 'ascendant', label: 'Rare Holo Star' },
  'Rare Holo V': { tier: 'elite', label: 'Rare Holo V' },
  'Rare Holo VMAX': { tier: 'apex', label: 'Rare Holo VMAX' },
  'Rare Holo VSTAR': { tier: 'apex', label: 'Rare Holo VSTAR' },
  'Rare Ultra': { tier: 'apex', label: 'Rare Ultra' },
  'Rare Secret': { tier: 'ascendant', label: 'Rare Secret' },
  'Rare Rainbow': { tier: 'ascendant', label: 'Rare Rainbow' },
  'Rare Prism Star': { tier: 'elite', label: 'Rare Prism Star' },
  'Rare Shiny': { tier: 'elite', label: 'Rare Shiny' },
  'Rare Shiny GX': { tier: 'ascendant', label: 'Rare Shiny GX' },
  'Rare BREAK': { tier: 'elite', label: 'Rare BREAK' },
  'Amazing Rare': { tier: 'apex', label: 'Amazing Rare' },
  LEGEND: { tier: 'ascendant', label: 'LEGEND' },
};

const TIER_ORDER: Record<RarityTier, number> = {
  eternal: 7,
  ascendant: 6,
  apex: 5,
  elite: 4,
  prime: 3,
  alloy: 2,
  core: 1,
};

function det01(seed: number): number {
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function pokemonIdFromCardId(cardId: string): number {
  const tail = cardId.split('-').pop();
  const n = tail ? Number.parseInt(tail, 10) : NaN;
  return Number.isFinite(n) ? n : 0;
}

/**
 * Catálogo de cartas alimentado desde la tabla `cartas_pokemon` (Supabase).
 * Mantiene el shape `PokeCard` para compatibilidad con el frontend ARCADIUM.
 */
@Injectable()
export class PokeapiService {
  private readonly logger = new Logger(PokeapiService.name);
  private cache: PokeCard[] | null = null;
  private cacheAt = 0;
  private inflightCatalog: Promise<PokeCard[]> | null = null;
  private readonly TTL_MS = 1000 * 60 * 5; // 5 min — la tabla puede cambiar

  constructor(private readonly prisma: PrismaService) {}

  invalidate() {
    this.cache = null;
    this.cacheAt = 0;
  }

  private mapRow(row: CartaPokemonRow): PokeCard {
    const pokemonId = pokemonIdFromCardId(row.id);
    const tierInfo: { tier: RarityTier; label: string } = (row.rareza
      ? RARITY_TO_TIER[row.rareza]
      : undefined) ?? {
      tier: 'core',
      label: row.rareza ?? 'Sin clasificar',
    };
    const variant = variantFor(pokemonId, tierInfo.tier);
    const seed = pokemonId || row.id.length;
    const stats = {
      hp: 50 + Math.floor(det01(seed * 7) * 200),
      attack: 40 + Math.floor(det01(seed * 11) * 130),
      defense: 40 + Math.floor(det01(seed * 13) * 110),
      speed: 30 + Math.floor(det01(seed * 17) * 130),
    };

    return {
      pokemonId,
      tcgId: row.id,
      name: row.nombre,
      type: row.tipo ?? 'Colorless',
      secondaryType: null,
      rarity: tierInfo.tier,
      rarityLabel: tierInfo.label,
      variant,
      imageUrl: row.imagen_large ?? row.imagen_small ?? '',
      marketPrice: Number(row.precio_mercado),
      stats,
      height: 0,
      weight: 0,
      abilities: [],
    };
  }

  async getCatalog(): Promise<PokeCard[]> {
    const now = Date.now();
    if (this.cache && now - this.cacheAt < this.TTL_MS) return this.cache;
    if (this.inflightCatalog) return this.inflightCatalog;

    this.inflightCatalog = (async () => {
      const t0 = Date.now();
      const rows = await this.prisma.$queryRaw<CartaPokemonRow[]>`
        SELECT id, nombre, pokedex_numero, rareza, tipo, imagen_small, imagen_large, precio_mercado
        FROM cartas_pokemon
      `;
      const cards = rows.map((r) => this.mapRow(r));

      cards.sort((a, b) => {
        const r =
          (TIER_ORDER[b.rarity as RarityTier] ?? 0) -
          (TIER_ORDER[a.rarity as RarityTier] ?? 0);
        if (r !== 0) return r;
        return b.marketPrice - a.marketPrice;
      });

      this.cache = cards;
      this.cacheAt = Date.now();
      this.logger.log(
        `Catálogo cargado desde Supabase: ${cards.length} cartas en ${Date.now() - t0}ms`,
      );
      return cards;
    })();

    try {
      return await this.inflightCatalog;
    } finally {
      this.inflightCatalog = null;
    }
  }

  async warmup() {
    this.getCatalog().catch((err) =>
      this.logger.warn(`Warmup falló: ${err.message}`),
    );
  }

  async findOne(tcgId: string): Promise<PokeCard | null> {
    const cat = await this.getCatalog();
    return cat.find((c) => c.tcgId === tcgId) ?? null;
  }

  /**
   * Convierte una fila de la tabla `Card` de Prisma al shape `PokeCard`.
   * Necesario para que CardsService.listPaginated() pueda mapear rows de BD.
   */
  rowToPokeCard(row: {
    pokemonId: number;
    tcgId: string | null;
    name: string;
    type: string;
    secondaryType: string | null;
    rarity: string;
    variant: string;
    imageUrl: string;
    marketPrice: string | number | { toNumber(): number };
  }): PokeCard {
    const mp =
      typeof row.marketPrice === 'object' && 'toNumber' in row.marketPrice
        ? row.marketPrice.toNumber()
        : Number(row.marketPrice);

    const tierInfo = RARITY_TO_TIER[row.rarity] ?? {
      tier: 'core' as const,
      label: row.rarity,
    };

    return {
      pokemonId: row.pokemonId,
      tcgId: row.tcgId ?? `legacy-${row.pokemonId}`,
      name: row.name,
      type: row.type,
      secondaryType: row.secondaryType,
      rarity: tierInfo.tier,
      rarityLabel: tierInfo.label,
      variant: row.variant,
      imageUrl: row.imageUrl,
      marketPrice: mp,
      // Stats no almacenadas en BD — valores por defecto seguros
      stats: { hp: 0, attack: 0, defense: 0, speed: 0 },
      height: 0,
      weight: 0,
      abilities: [],
    };
  }
}
