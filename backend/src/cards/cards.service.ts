import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PokeapiService, PokeCard } from './pokeapi.service';

@Injectable()
export class CardsService {
  constructor(
    private readonly poke: PokeapiService,
    private readonly prisma: PrismaService,
  ) {}

  async listAll() {
    return this.poke.getCatalog();
  }

  async getOne(pokemonId: number) {
    const card = await this.poke.findOne(pokemonId);
    if (!card) throw new NotFoundException('Carta no encontrada');
    return card;
  }

  /** Asegura que la carta exista en BD (para FK de orders/user_cards) y devuelve el row. */
  async ensureInDb(pokemonId: number) {
    const card = await this.getOne(pokemonId);
    return this.prisma.card.upsert({
      where: { pokemonId: card.pokemonId },
      update: {
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
