import { Controller, Get, Header, Param, ParseIntPipe } from '@nestjs/common';
import { CardsService } from './cards.service';

@Controller('cards')
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async list() {
    const cards = await this.cards.listAll();
    return { count: cards.length, cards };
  }

  @Get('trending')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async trending() {
    const cards = await this.cards.listAll();
    return { cards: cards.slice(0, 8) };
  }

  @Get(':pokemonId')
  @Header('Cache-Control', 'public, max-age=300')
  async one(@Param('pokemonId', ParseIntPipe) pokemonId: number) {
    return this.cards.getOne(pokemonId);
  }
}
