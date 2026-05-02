import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { PokeapiService } from './pokeapi.service';

@Module({
  providers: [CardsService, PokeapiService],
  controllers: [CardsController],
  exports: [CardsService, PokeapiService],
})
export class CardsModule {}
