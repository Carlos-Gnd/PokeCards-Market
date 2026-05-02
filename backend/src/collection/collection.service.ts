import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollectionService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const items = await this.prisma.userCard.findMany({
      where: { userId },
      include: { card: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((uc) => ({
      id: uc.id,
      quantity: uc.quantity,
      obtainedFrom: uc.obtainedFrom,
      acquiredAt: uc.createdAt,
      card: {
        id: Number(uc.card.id),
        pokemonId: uc.card.pokemonId,
        name: uc.card.name,
        type: uc.card.type,
        secondaryType: uc.card.secondaryType,
        rarity: uc.card.rarity,
        variant: uc.card.variant,
        imageUrl: uc.card.imageUrl,
        marketPrice: Number(uc.card.marketPrice),
      },
    }));
  }

  async ownedPokemonIds(userId: string): Promise<number[]> {
    const items = await this.prisma.userCard.findMany({
      where: { userId },
      include: { card: { select: { pokemonId: true } } },
    });
    return items.map((i) => i.card.pokemonId);
  }
}
