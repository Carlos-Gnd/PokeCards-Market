import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaypalClient } from './paypal.client';
import { CardsModule } from '../cards/cards.module';

@Module({
  imports: [CardsModule],
  providers: [PaymentsService, PaypalClient],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
