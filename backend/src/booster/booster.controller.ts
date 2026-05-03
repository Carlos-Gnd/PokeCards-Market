import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { BoosterService } from './booster.service';
import type { BoosterCaptureResult, BoosterPack } from './booster.types';

export class CaptureBoosterDto {
  @IsString()
  paypalOrderId!: string;

  /**
   * userId opcional — si se omite, el pack no se persiste en colección.
   * Cuando el usuario está autenticado, el frontend lo pasa desde el store.
   */
  @IsUUID('4')
  @IsOptional()
  userId?: string;
}

/**
 * BoosterController — migra los 3 endpoints de express-api (puerto 3001)
 * al NestJS unificado (puerto 3000).
 *
 * Mapeo de rutas antiguas → nuevas:
 *   GET  /api/booster-pack                → GET  /api/booster/demo
 *   POST /api/booster-pack/create-order   → POST /api/booster/create-order
 *   POST /api/booster-pack/capture-order  → POST /api/booster/capture-order
 *
 * El frontend ya apunta a VITE_API_URL para todos los calls.
 * La variable VITE_BOOSTER_API_URL puede eliminarse del .env.
 */
@Controller('booster')
export class BoosterController {
  constructor(private readonly booster: BoosterService) {}

  /** Abre un sobre sin pago (modo demo / testing). */
  @Get('demo')
  demo(): Promise<BoosterPack> {
    return this.booster.openDemo();
  }

  /** Crea una orden de PayPal para pagar el sobre. */
  @Post('create-order')
  @HttpCode(HttpStatus.CREATED)
  createOrder(): Promise<{
    paypalOrderId: string;
    amount: string;
    currency: string;
  }> {
    return this.booster.createOrder();
  }

  /**
   * Captura el pago y devuelve las 5 cartas.
   * Si `userId` está presente, persiste en `colecciones_usuario`.
   */
  @Post('capture-order')
  @HttpCode(HttpStatus.OK)
  captureOrder(@Body() dto: CaptureBoosterDto): Promise<BoosterCaptureResult> {
    return this.booster.captureOrder(dto.paypalOrderId, dto.userId);
  }
}
