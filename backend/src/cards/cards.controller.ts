// ── backend/src/cards/cards.controller.ts ────────────────────────────────────
import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { CardsService } from './cards.service';

// Solo los filtros opcionales — sin page ni limit (esos son números, se parsean aparte)
export interface CardListQuery {
  rarity?: string;
  type?: string;
  search?: string;
  sort?: string;
}

@Controller('cards')
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async list(
    @Query('page') rawPage: string = '1',
    @Query('limit') rawLimit: string = '48',
    @Query() q: CardListQuery,
  ) {
    const page = Math.max(1, parseInt(rawPage, 10) || 1);
    const limit = Math.min(96, Math.max(12, parseInt(rawLimit, 10) || 48));
    // Pasamos page y limit como números — ya no hay conflicto de tipos
    return this.cards.listPaginated({ page, limit, ...q });
  }

  @Get('trending')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async trending() {
    const cards = await this.cards.listTrending();
    return { cards };
  }

  @Get(':tcgId')
  @Header('Cache-Control', 'public, max-age=300')
  async one(@Param('tcgId') tcgId: string) {
    return this.cards.getOne(tcgId);
  }
}
