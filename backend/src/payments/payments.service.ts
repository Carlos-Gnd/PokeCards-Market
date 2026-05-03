import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CardsService } from '../cards/cards.service';
import { PaypalClient } from './paypal.client';
import type { Prisma } from '@prisma/client';

/** Shape de un UserCard con su card incluida (de Prisma include). */
type UserCardWithCard = Prisma.UserCardGetPayload<{ include: { card: true } }>;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cards: CardsService,
    private readonly paypal: PaypalClient,
  ) {}

  /** Crea una orden de PayPal a partir del pokemonId. Devuelve { paypalOrderId, approveUrl, ... }. */
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

    let orderCreated: { id: string; approveUrl: string | undefined };
    try {
      orderCreated = await this.paypal.createOrder(
        Number(amount),
        `arcadium_${card.pokemonId}`,
        `ARCADIUM · ${card.name} (${card.rarity}/${card.variant})`,
      );
    } catch (err: unknown) {
      this.logger.error(
        `PayPal create-order falló: ${err instanceof Error ? err.message : err}`,
      );
      throw new BadRequestException('No se pudo crear la orden de PayPal');
    }

    // Persistir la intención de compra
    await this.prisma.order.create({
      data: {
        userId,
        cardId: card.id,
        paypalOrderId: orderCreated.id,
        status: 'CREATED',
        amount: card.marketPrice,
      },
    });

    return {
      paypalOrderId: orderCreated.id,
      approveUrl: orderCreated.approveUrl,
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

  /** Serializa un UserCard para respuestas públicas (convierte BigInt → number). */
  private toPublicUserCard(userCard: UserCardWithCard) {
    return {
      id: userCard.id,
      quantity: userCard.quantity,
      obtainedFrom: userCard.obtainedFrom,
      acquiredAt: userCard.createdAt,
      cardId: Number(userCard.cardId),
      card: {
        id: Number(userCard.card.id),
        pokemonId: userCard.card.pokemonId,
        name: userCard.card.name,
        type: userCard.card.type,
        secondaryType: userCard.card.secondaryType,
        rarity: userCard.card.rarity,
        variant: userCard.card.variant,
        imageUrl: userCard.card.imageUrl,
        marketPrice: Number(userCard.card.marketPrice),
      },
    };
  }

  /** Captura el pago en PayPal y desbloquea la carta para el usuario. */
  async captureOrder(userId: string, paypalOrderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { paypalOrderId },
    });
    if (!order) throw new NotFoundException('Orden no registrada');
    if (order.userId !== userId) {
      throw new BadRequestException('Esta orden no pertenece al usuario');
    }

    // Idempotencia: ya fue capturada antes
    if (order.status === 'COMPLETED') {
      const userCard = await this.prisma.userCard.findUnique({
        where: { userId_cardId: { userId, cardId: order.cardId } },
        include: { card: true },
      });
      return {
        alreadyCaptured: true,
        userCard: userCard ? this.toPublicUserCard(userCard) : null,
      };
    }

    let captureStatus: string;
    let capturedAmount: number | null;
    try {
      const result = await this.paypal.captureOrder(paypalOrderId);
      captureStatus = result.status;
      capturedAmount = result.capturedAmount;
    } catch (err: unknown) {
      this.logger.error(
        `PayPal capture-order falló: ${err instanceof Error ? err.message : err}`,
      );
      await this.prisma.order.update({
        where: { paypalOrderId },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException('La captura del pago falló en PayPal');
    }

    if (captureStatus !== 'COMPLETED') {
      await this.prisma.order.update({
        where: { paypalOrderId },
        data: { status: captureStatus || 'FAILED' },
      });
      throw new BadRequestException(
        `Pago no completado (estado: ${captureStatus})`,
      );
    }

    // Validación: el monto capturado debe coincidir con el de la orden
    if (
      capturedAmount !== null &&
      Math.abs(capturedAmount - Number(order.amount)) > 0.01
    ) {
      this.logger.warn(
        `Monto capturado (${capturedAmount}) ≠ orden (${order.amount}) para ${paypalOrderId}`,
      );
      throw new BadRequestException(
        'El monto capturado no coincide con la orden',
      );
    }

    // Transacción atómica: marca COMPLETED + crea user_card + refleja en colecciones_usuario
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

      // Reflejo en tabla legacy (colecciones_usuario) para el módulo de booster
      const cartaPokemonId = `sv3pt5-${userCard.card.pokemonId}`;
      await tx.$executeRaw`
        INSERT INTO colecciones_usuario (user_id, carta_id, paypal_order_id, obtenida_de)
        SELECT
          ${userId}::varchar,
          ${cartaPokemonId}::varchar,
          ${paypalOrderId}::varchar,
          'marketplace'
        WHERE EXISTS (
          SELECT 1 FROM cartas_pokemon WHERE id = ${cartaPokemonId}
        )
        AND NOT EXISTS (
          SELECT 1 FROM colecciones_usuario
          WHERE user_id = ${userId}::varchar
            AND paypal_order_id = ${paypalOrderId}::varchar
        )
      `;

      return { updatedOrder, userCard };
    });

    return {
      success: true,
      paypalOrderId,
      amount: Number(order.amount),
      userCard: this.toPublicUserCard(result.userCard),
    };
  }

  async history(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { card: true },
    });
    return orders.map((o) => ({
      id: o.id,
      paypalOrderId: o.paypalOrderId,
      status: o.status,
      amount: Number(o.amount),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      cardId: Number(o.cardId),
      card: {
        id: Number(o.card.id),
        pokemonId: o.card.pokemonId,
        name: o.card.name,
        type: o.card.type,
        rarity: o.card.rarity,
        variant: o.card.variant,
        imageUrl: o.card.imageUrl,
        marketPrice: Number(o.card.marketPrice),
      },
    }));
  }
}
