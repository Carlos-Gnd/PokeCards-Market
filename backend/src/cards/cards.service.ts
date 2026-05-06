// ── backend/src/cards/cards.service.ts — v2.0 ────────────────────────────────
// ensureInDb ahora persiste setId, hp, attack, defense, speed.
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PokeapiService, PokeCard } from './pokeapi.service';

@Injectable()
export class CardsService {
  constructor(
    private readonly poke: PokeapiService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Listado paginado y filtrado ───────────────────────────────────────────

  async listPaginated(q: {
    page: number;
    limit: number;
    rarity?: string;
    type?: string;
    search?: string;
    sort?: string;
    setId?: string;
  }) {
    const { page, limit, rarity, type, search, sort, setId } = q;

    let allCards = await this.poke.getCatalog();

    // Filtro por Expansión
    if (setId) {
      allCards = allCards.filter((c) => c.setId === setId);
    }
    if (rarity) {
      allCards = allCards.filter(
        (c) => c.rarity === rarity || c.rarityLabel === rarity,
      );
    }
    if (type) {
      allCards = allCards.filter(
        (c) => c.type === type || c.secondaryType === type,
      );
    }
    if (search) {
      const s = search.toLowerCase();
      allCards = allCards.filter((c) => c.name.toLowerCase().includes(s));
    }

    allCards.sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return a.marketPrice - b.marketPrice;
        case 'price-desc':
          return b.marketPrice - a.marketPrice;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'rarity-desc':
          return b.marketPrice - a.marketPrice;
        case 'rarity-asc':
          return a.marketPrice - b.marketPrice;
        default:
          return 0;
      }
    });

    const total = allCards.length;
    const startIndex = (page - 1) * limit;
    const paginatedCards = allCards.slice(startIndex, startIndex + limit);

    return {
      count: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      cards: paginatedCards,
    };
  }

  // ── Trending (8 cartas de mayor precio) ──────────────────────────────────

  async listTrending(): Promise<PokeCard[]> {
    const allCards = await this.poke.getCatalog();
    return [...allCards]
      .sort((a, b) => b.marketPrice - a.marketPrice)
      .slice(0, 8);
  }

  async listAll() {
    return this.poke.getCatalog();
  }

  async getOne(tcgId: string) {
    const card = await this.poke.findOne(tcgId);
    if (!card) throw new NotFoundException('Carta no encontrada');
    return card;
  }

  // ── ensureInDb — Upsert SSOT ──────────────────────────────────────────────
  async ensureInDb(tcgId: string) {
    const card = await this.getOne(tcgId);

    return this.prisma.card.upsert({
      where: { tcgId: card.tcgId },
      update: {
        pokemonId: card.pokemonId,
        setId: card.setId,
        name: card.name,
        type: card.type,
        secondaryType: card.secondaryType,
        rarity: card.rarity,
        variant: card.variant,
        imageUrl: card.imageUrl,
        marketPrice: card.marketPrice,
        hp: card.stats.hp,
        attack: card.stats.attack,
        defense: card.stats.defense,
        speed: card.stats.speed,
      },
      create: {
        tcgId: card.tcgId,
        pokemonId: card.pokemonId,
        setId: card.setId,
        name: card.name,
        type: card.type,
        secondaryType: card.secondaryType,
        rarity: card.rarity,
        variant: card.variant,
        imageUrl: card.imageUrl,
        marketPrice: card.marketPrice,
        hp: card.stats.hp,
        attack: card.stats.attack,
        defense: card.stats.defense,
        speed: card.stats.speed,
      },
    });
  }

  toPublic(card: PokeCard) {
    return card;
  }
}
