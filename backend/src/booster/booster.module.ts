// ── backend/src/booster/booster.module.ts ────────────────────────────────────
import { Module } from '@nestjs/common';
import { BoosterController } from './booster.controller';
import { BoosterService } from './booster.service';
import { PaypalClient } from '../payments/paypal.client';
import { CardsModule } from '../cards/cards.module';
@Module({
  imports: [CardsModule],
  controllers: [BoosterController],
  providers: [BoosterService, PaypalClient],
})
export class BoosterModule {}
