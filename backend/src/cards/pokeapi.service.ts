// ── backend/src/cards/pokeapi.service.ts ─────────────────────────────────────
// v2.0 — Lee el catálogo desde la tabla `cards` (Prisma SSOT).
// Las tablas legacy cartas_pokemon / colecciones_usuario ya no existen.
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RarityTier } from './rarity.util';
import type { Card } from '@prisma/client';

// ── Interfaces públicas ───────────────────────────────────────────────────────

export interface PokeCard {
  pokemonId: number;
  tcgId: string;
  setId: string;
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

// ── Mapas de rareza ───────────────────────────────────────────────────────────

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

// ── Servicio ──────────────────────────────────────────────────────────────────

/**
 * Catálogo de cartas alimentado desde la tabla `cards` gestionada por Prisma.
 * Mantiene el shape `PokeCard` para compatibilidad con el resto del sistema.
 *
 * v2.0: ya no accede a `cartas_pokemon` — Prisma es el único dueño de la BD.
 */
@Injectable()
export class PokeapiService {
  private readonly logger = new Logger(PokeapiService.name);
  private cache: PokeCard[] | null = null;
  private cacheAt = 0;
  private inflightCatalog: Promise<PokeCard[]> | null = null;
  private readonly TTL_MS = 1000 * 60 * 5; // 5 min

  constructor(private readonly prisma: PrismaService) {}

  // ── Cache management ────────────────────────────────────────────────────────

  invalidate() {
    this.cache = null;
    this.cacheAt = 0;
  }

  // ── Mapper (Prisma Card → PokeCard) ─────────────────────────────────────────

  /**
   * Convierte un registro `Card` de Prisma al shape público `PokeCard`.
   * Los stats ahora vienen directamente de la BD — no se calculan on-the-fly.
   */
  rowToPokeCard(row: Card): PokeCard {
    const mp =
      typeof row.marketPrice === 'object' && 'toNumber' in row.marketPrice
        ? (row.marketPrice as { toNumber(): number }).toNumber()
        : Number(row.marketPrice);

    const tierInfo = RARITY_TO_TIER[row.rarity] ?? {
      tier: 'core' as const,
      label: row.rarity,
    };

    return {
      pokemonId: row.pokemonId,
      tcgId: row.tcgId,
      setId: row.setId,
      name: row.name,
      type: row.type,
      secondaryType: row.secondaryType,
      rarity: tierInfo.tier,
      rarityLabel: tierInfo.label,
      variant: row.variant,
      imageUrl: row.imageUrl,
      marketPrice: mp,
      stats: {
        hp: row.hp,
        attack: row.attack,
        defense: row.defense,
        speed: row.speed,
      },
      height: 0,
      weight: 0,
      abilities: [],
    };
  }

  // ── Catálogo ─────────────────────────────────────────────────────────────────

  /**
   * Devuelve el catálogo completo de cartas desde la tabla `cards`.
   * Cacheado 5 minutos en memoria para evitar N queries por petición.
   */
  async getCatalog(): Promise<PokeCard[]> {
    const now = Date.now();
    if (this.cache && now - this.cacheAt < this.TTL_MS) return this.cache;
    if (this.inflightCatalog) return this.inflightCatalog;

    this.inflightCatalog = (async () => {
      const t0 = Date.now();

      // ✅ v2.0 — Prisma ORM, no $queryRaw ni cartas_pokemon
      const rows = await this.prisma.card.findMany({
        orderBy: [{ marketPrice: 'desc' }],
      });

      const cards = rows.map((r) => this.rowToPokeCard(r));

      // Ordenar por tier de rareza → precio como desempate
      cards.sort((a, b) => {
        const r =
          (TIER_ORDER[b.rarity as RarityTier] ?? 0) -
          (TIER_ORDER[a.rarity as RarityTier] ?? 0);
        return r !== 0 ? r : b.marketPrice - a.marketPrice;
      });

      this.cache = cards;
      this.cacheAt = Date.now();
      this.logger.log(
        `Catálogo cargado desde Prisma (cards): ${cards.length} cartas en ${Date.now() - t0}ms`,
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
    await this.getCatalog().catch((err: Error) =>
      this.logger.warn(`Warmup falló: ${err.message}`),
    );
  }

  async findOne(tcgId: string): Promise<PokeCard | null> {
    const cat = await this.getCatalog();
    return cat.find((c) => c.tcgId === tcgId) ?? null;
  }
}
