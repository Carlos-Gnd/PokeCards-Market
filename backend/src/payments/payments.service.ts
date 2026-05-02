import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as paypal from '@paypal/checkout-server-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { CardsService } from '../cards/cards.service';
import { PaypalClient } from './paypal.client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cards: CardsService,
    private readonly paypal: PaypalClient,
  ) {}

  /** Crea una orden de PayPal a partir del pokemonId. Devuelve { id, approveUrl }. */
  async createOrder(userId: string, pokemonId: number) {
    const card = await this.cards.ensureInDb(pokemonId);

    // Validar que el usuario no posea ya esta carta
    const owned = await this.prisma.userCard.findUnique({
      where: { userId_cardId: { userId, cardId: card.id } },
    });
    if (owned) {
      throw new ConflictException('Ya posees esta carta en tu colección');
    }

    const amount = Number(card.marketPrice).toFixed(2);

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `arcadium_${card.pokemonId}`,
          description: `ARCADIUM · ${card.name} (${card.rarity}/${card.variant})`,
          custom_id: `${userId}:${card.id}`,
          amount: {
            currency_code: 'USD',
            value: amount,
          },
        },
      ],
      application_context: {
        brand_name: 'ARCADIUM',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
      },
    });

    let response;
    try {
      response = await this.paypal.http.execute(request);
    } catch (err) {
      this.logger.error(`PayPal create-order falló: ${(err as Error).message}`);
      throw new BadRequestException('No se pudo crear la orden de PayPal');
    }

    const paypalOrderId: string = response.result.id;
    const approve = (response.result.links ?? []).find((l: any) => l.rel === 'approve');

    // Persistimos la intención
    await this.prisma.order.create({
      data: {
        userId,
        cardId: card.id,
        paypalOrderId,
        status: 'CREATED',
        amount: card.marketPrice,
      },
    });

    return {
      paypalOrderId,
      approveUrl: approve?.href,
      amount,
      card: {
        id: Number(card.id),
        pokemonId: card.pokemonId,
        name: card.name,
        rarity: card.rarity,
        variant: card.variant,
      },
    };
  }

  /** Captura el pago, valida con PayPal y desbloquea la carta para el usuario. */
  async captureOrder(userId: string, paypalOrderId: string) {
    const order = await this.prisma.order.findUnique({ where: { paypalOrderId } });
    if (!order) throw new NotFoundException('Orden no registrada');
    if (order.userId !== userId) {
      throw new BadRequestException('Esta orden no pertenece al usuario');
    }
    if (order.status === 'COMPLETED') {
      // Idempotencia: ya capturada antes
      const userCard = await this.prisma.userCard.findUnique({
        where: { userId_cardId: { userId, cardId: order.cardId } },
        include: { card: true },
      });
      return { alreadyCaptured: true, userCard };
    }

    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({} as any);

    let response;
    try {
      response = await this.paypal.http.execute(request);
    } catch (err) {
      this.logger.error(`PayPal capture-order falló: ${(err as Error).message}`);
      await this.prisma.order.update({
        where: { paypalOrderId },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException('La captura del pago falló en PayPal');
    }

    const status: string = response.result.status;
    if (status !== 'COMPLETED') {
      await this.prisma.order.update({
        where: { paypalOrderId },
        data: { status: status || 'FAILED' },
      });
      throw new BadRequestException(`Pago no completado (estado: ${status})`);
    }

    // Validación: el monto capturado debe coincidir con el guardado
    const capture = response.result.purchase_units?.[0]?.payments?.captures?.[0];
    const capturedAmount = Number(capture?.amount?.value ?? 0);
    if (Math.abs(capturedAmount - Number(order.amount)) > 0.01) {
      this.logger.warn(`Monto capturado (${capturedAmount}) ≠ orden (${order.amount})`);
      throw new BadRequestException('El monto capturado no coincide');
    }

    // Transacción: marca COMPLETED + crea user_card + registra en colecciones_usuario
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { paypalOrderId },
        data: { status: 'COMPLETED' },
      });

      const userCard = await tx.userCard.upsert({
        where: { userId_cardId: { userId, cardId: order.cardId } },
        update: {
          quantity: { increment: 1 },
          orderId: updatedOrder.id,
        },
        create: {
          userId,
          cardId: order.cardId,
          obtainedFrom: 'purchase',
          orderId: updatedOrder.id,
        },
        include: { card: true },
      });

      // Fuente unificada de colección: refleja la compra individual aquí también
      const cartaPokemonId = `sv3pt5-${userCard.card.pokemonId}`;
      await tx.$executeRaw`
        INSERT INTO colecciones_usuario (user_id, carta_id, paypal_order_id, obtenida_de)
        SELECT ${userId}::varchar, ${cartaPokemonId}::varchar, ${paypalOrderId}::varchar, 'marketplace'
        WHERE EXISTS (SELECT 1 FROM cartas_pokemon WHERE id = ${cartaPokemonId})
          AND NOT EXISTS (
            SELECT 1 FROM colecciones_usuario
            WHERE user_id = ${userId}::varchar AND paypal_order_id = ${paypalOrderId}::varchar
          )
      `;

      return { updatedOrder, userCard };
    });

    return {
      success: true,
      paypalOrderId,
      amount: Number(order.amount),
      userCard: {
        ...result.userCard,
        cardId: Number(result.userCard.cardId),
        card: {
          ...result.userCard.card,
          id: Number(result.userCard.card.id),
          marketPrice: Number(result.userCard.card.marketPrice),
        },
      },
    };
  }

  async history(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { card: true },
    });
    return orders.map((o) => ({
      ...o,
      cardId: Number(o.cardId),
      amount: Number(o.amount),
      card: { ...o.card, id: Number(o.card.id), marketPrice: Number(o.card.marketPrice) },
    }));
  }
}
