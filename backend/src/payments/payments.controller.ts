import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/current-user.decorator';
import { CreateOrderDto, CaptureOrderDto } from './dto';

@Controller('payments')
@UseGuards(SupabaseAuthGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('create-order')
  create(@CurrentUser() user: SessionUser, @Body() dto: CreateOrderDto) {
    return this.payments.createOrder(user.id, dto.pokemonId);
  }

  @Post('capture-order')
  capture(@CurrentUser() user: SessionUser, @Body() dto: CaptureOrderDto) {
    return this.payments.captureOrder(user.id, dto.paypalOrderId);
  }

  @Get('history')
  history(@CurrentUser() user: SessionUser) {
    return this.payments.history(user.id);
  }
}
