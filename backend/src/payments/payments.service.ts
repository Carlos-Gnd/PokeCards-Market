// ── backend/src/payments/payments.service.ts — v2.0 ──────────────────────────
// Eliminados todos los $executeRaw a colecciones_usuario.
// La transacción atómica sólo escribe en orders + user_cards (Prisma SSOT).
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

  // ── createOrder ───────────────────────────────────────────────────────────

  /** Crea una orden de PayPal a partir del tcgId (ej. "sv4pt5-25"). */
  async createOrder(userId: string, tcgId: string) {
    const card = await this.cards.ensureInDb(tcgId);

    // El usuario no puede comprar una carta que ya posee
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
        `arcadium_${card.tcgId}`,
        `ARCADIUM · ${card.name} (${card.rarity}/${card.variant})`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`PayPal create-order falló: ${message}`);
      throw new BadRequestException('No se pudo crear la orden de PayPal');
    }

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
        pokemonId: card.pokemonId,
        tcgId: card.tcgId,
        name: card.name,
        rarity: card.rarity,
        variant: card.variant,
      },
    };
  }

  // ── captureOrder ──────────────────────────────────────────────────────────

  /** Captura el pago en PayPal y desbloquea la carta para el usuario. */
  async captureOrder(userId: string, paypalOrderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { paypalOrderId },
    });
    if (!order) throw new NotFoundException('Orden no registrada');
    if (order.userId !== userId) {
      throw new BadRequestException('Esta orden no pertenece al usuario');
    }

    // Idempotencia — ya fue capturada antes
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
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`PayPal capture-order falló: ${message}`);
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

    // Validación de monto
    if (
      capturedAmount !== null &&
      Math.abs(capturedAmount - Number(order.amount)) > 0.01
    ) {
      this.logger.warn(
        `Monto capturado (${capturedAmount}) ≠ orden (${Number(order.amount)}) para ${paypalOrderId}`,
      );
      throw new BadRequestException(
        'El monto capturado no coincide con la orden',
      );
    }

    // ✅ v2.0 — Transacción atómica sin legacy inserts
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { paypalOrderId },
        data: { status: 'COMPLETED' },
      });

      const userCard = await tx.userCard.upsert({
        where: { userId_cardId: { userId, cardId: order.cardId } },
        update: { quantity: { increment: 1 }, orderId: updatedOrder.id },
        create: {
          userId,
          cardId: order.cardId,
          obtainedFrom: 'purchase',
          orderId: updatedOrder.id,
        },
        include: { card: true },
      });

      return { updatedOrder, userCard };
    });

    return {
      success: true,
      paypalOrderId,
      amount: Number(order.amount),
      userCard: this.toPublicUserCard(result.userCard),
    };
  }

  // ── history ───────────────────────────────────────────────────────────────

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
        pokemonId: o.card.pokemonId,
        tcgId: o.card.tcgId,
        name: o.card.name,
        type: o.card.type,
        rarity: o.card.rarity,
        variant: o.card.variant,
        imageUrl: o.card.imageUrl,
        marketPrice: Number(o.card.marketPrice),
      },
    }));
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  /** Serializa un UserCard para respuestas públicas (convierte BigInt → number). */
  private toPublicUserCard(userCard: UserCardWithCard) {
    return {
      id: userCard.id,
      quantity: userCard.quantity,
      obtainedFrom: userCard.obtainedFrom,
      acquiredAt: userCard.createdAt,
      cardId: Number(userCard.cardId),
      card: {
        pokemonId: userCard.card.pokemonId,
        tcgId: userCard.card.tcgId,
        setId: userCard.card.setId,
        name: userCard.card.name,
        type: userCard.card.type,
        secondaryType: userCard.card.secondaryType,
        rarity: userCard.card.rarity,
        variant: userCard.card.variant,
        imageUrl: userCard.card.imageUrl,
        marketPrice: Number(userCard.card.marketPrice),
        stats: {
          hp: userCard.card.hp,
          attack: userCard.card.attack,
          defense: userCard.card.defense,
          speed: userCard.card.speed,
        },
      },
    };
  }
}
