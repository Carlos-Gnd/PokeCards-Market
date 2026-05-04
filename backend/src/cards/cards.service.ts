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

    // Construir filtro WHERE dinámico
    const where: Prisma.CardWhereInput = {};
    if (rarity) where.rarity = rarity;
    if (type) where.OR = [{ type }, { secondaryType: type }];
    if (search) where.name = { contains: search, mode: 'insensitive' };

    // Construir ORDER BY
    let orderBy: Prisma.CardOrderByWithRelationInput[] = [
      { marketPrice: 'desc' },
    ];
    switch (sort) {
      case 'price-asc':
        orderBy = [{ marketPrice: 'asc' }];
        break;
      case 'price-desc':
        orderBy = [{ marketPrice: 'desc' }];
        break;
      case 'name-asc':
        orderBy = [{ name: 'asc' }];
        break;
      case 'rarity-desc':
        orderBy = [{ marketPrice: 'desc' }];
        break;
      case 'rarity-asc':
        orderBy = [{ marketPrice: 'asc' }];
        break;
    }

    const [total, cards] = await Promise.all([
      this.prisma.card.count({ where }), // Ya no necesita "as any"
      this.prisma.card.findMany({
        where, // Ya no necesita "as any"
        orderBy, // Ya no necesita "as any"
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Mapear al shape público que ya espera el frontend
    const mapped = cards.map((c) => this.poke.rowToPokeCard(c));

    return {
      count: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      cards: mapped,
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
