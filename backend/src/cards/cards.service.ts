// ── backend/src/cards/cards.service.ts ───────────────────────────────────────
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PokeapiService, PokeCard } from './pokeapi.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CardsService {
  constructor(
    private readonly poke: PokeapiService,
    private readonly prisma: PrismaService,
  ) {}

  // ── NUEVO: listado paginado y filtrado ────────────────────────────────────
  async listPaginated(q: {
    page: number;
    limit: number;
    rarity?: string;
    type?: string;
    search?: string;
    sort?: string;
  }) {
    const { page, limit, rarity, type, search, sort } = q;

    // 1. Traer todo el catálogo (súper rápido porque está cacheado y lee de cartas_pokemon)
    let allCards = await this.poke.getCatalog();

    // 2. Aplicar los filtros de la UI
    if (rarity) {
      allCards = allCards.filter((c) => c.rarity === rarity);
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

    // 3. Aplicar el ordenamiento
    allCards.sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return a.marketPrice - b.marketPrice;
        case 'price-desc':
          return b.marketPrice - a.marketPrice;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'rarity-desc':
          return b.marketPrice - a.marketPrice; // Usamos precio como proxy de rareza
        case 'rarity-asc':
          return a.marketPrice - b.marketPrice;
        default:
          return 0;
      }
    });

    // 4. Recortar el array para la paginación exacta
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

  // ── NUEVO: trending (8 cartas de mayor precio) ────────────────────────────
  async listTrending(): Promise<PokeCard[]> {
    const cards = await this.prisma.card.findMany({
      orderBy: { marketPrice: 'desc' },
      take: 8,
    });
    return cards.map((c) => this.poke.rowToPokeCard(c));
  }

  // ── Sin cambios desde aquí ────────────────────────────────────────────────
  async listAll() {
    return this.poke.getCatalog();
  }

  async getOne(tcgId: string) {
    const card = await this.poke.findOne(tcgId);
    if (!card) throw new NotFoundException('Carta no encontrada');
    return card;
  }

  async ensureInDb(tcgId: string) {
    const card = await this.getOne(tcgId);
    return this.prisma.card.upsert({
      where: { tcgId: card.tcgId },
      update: {
        pokemonId: card.pokemonId,
        name: card.name,
        type: card.type,
        secondaryType: card.secondaryType,
        rarity: card.rarity,
        variant: card.variant,
        imageUrl: card.imageUrl,
        marketPrice: card.marketPrice,
      },
      create: {
        pokemonId: card.pokemonId,
        tcgId: card.tcgId,
        name: card.name,
        type: card.type,
        secondaryType: card.secondaryType,
        rarity: card.rarity,
        variant: card.variant,
        imageUrl: card.imageUrl,
        marketPrice: card.marketPrice,
      },
    });
  }

  toPublic(card: PokeCard) {
    return card;
  }
}
