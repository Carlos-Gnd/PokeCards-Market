import { Controller, Get, UseGuards } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/current-user.decorator';

@Controller('collection')
@UseGuards(JwtAuthGuard)
export class CollectionController {
  constructor(private readonly collection: CollectionService) {}

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.collection.listForUser(user.id);
  }

  @Get('ids')
  ownedIds(@CurrentUser() user: SessionUser) {
    return this.collection.ownedPokemonIds(user.id);
  }
}
