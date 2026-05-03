import { Module } from '@nestjs/common';
import { BoosterController } from './booster.controller';
import { BoosterService } from './booster.service';
import { PaypalClient } from '../payments/paypal.client';

@Module({
  controllers: [BoosterController],
  providers: [BoosterService, PaypalClient],
})
export class BoosterModule {}
