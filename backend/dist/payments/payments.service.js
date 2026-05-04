"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const cards_service_1 = require("../cards/cards.service");
const paypal_client_1 = require("./paypal.client");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    prisma;
    cards;
    paypal;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(prisma, cards, paypal) {
        this.prisma = prisma;
        this.cards = cards;
        this.paypal = paypal;
    }
    async createOrder(userId, tcgId) {
        const card = await this.cards.ensureInDb(tcgId);
        const owned = await this.prisma.userCard.findUnique({
            where: { userId_cardId: { userId, cardId: card.id } },
        });
        if (owned) {
            throw new common_1.ConflictException('Ya posees esta carta en tu colección');
        }
        const amount = Number(card.marketPrice).toFixed(2);
        let orderCreated;
        try {
            orderCreated = await this.paypal.createOrder(Number(amount), `arcadium_${card.pokemonId}`, `ARCADIUM · ${card.name} (${card.rarity}/${card.variant})`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`PayPal create-order falló: ${message}`);
            throw new common_1.BadRequestException('No se pudo crear la orden de PayPal');
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
                id: Number(card.id),
                pokemonId: card.pokemonId,
                tcgId: card.tcgId,
                name: card.name,
                rarity: card.rarity,
                variant: card.variant,
            },
        };
    }
    toPublicUserCard(userCard) {
        return {
            id: userCard.id,
            quantity: userCard.quantity,
            obtainedFrom: userCard.obtainedFrom,
            acquiredAt: userCard.createdAt,
            cardId: Number(userCard.cardId),
            card: {
                id: Number(userCard.card.id),
                pokemonId: userCard.card.pokemonId,
                tcgId: userCard.card.tcgId,
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
    async captureOrder(userId, paypalOrderId) {
        const order = await this.prisma.order.findUnique({
            where: { paypalOrderId },
        });
        if (!order)
            throw new common_1.NotFoundException('Orden no registrada');
        if (order.userId !== userId) {
            throw new common_1.BadRequestException('Esta orden no pertenece al usuario');
        }
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
        let captureStatus;
        let capturedAmount;
        try {
            const result = await this.paypal.captureOrder(paypalOrderId);
            captureStatus = result.status;
            capturedAmount = result.capturedAmount;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`PayPal capture-order falló: ${message}`);
            await this.prisma.order.update({
                where: { paypalOrderId },
                data: { status: 'FAILED' },
            });
            throw new common_1.BadRequestException('La captura del pago falló en PayPal');
        }
        if (captureStatus !== 'COMPLETED') {
            await this.prisma.order.update({
                where: { paypalOrderId },
                data: { status: captureStatus || 'FAILED' },
            });
            throw new common_1.BadRequestException(`Pago no completado (estado: ${captureStatus})`);
        }
        if (capturedAmount !== null &&
            Math.abs(capturedAmount - Number(order.amount)) > 0.01) {
            this.logger.warn(`Monto capturado (${capturedAmount}) ≠ orden (${Number(order.amount)}) para ${paypalOrderId}`);
            throw new common_1.BadRequestException('El monto capturado no coincide con la orden');
        }
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
            const cartaPokemonId = userCard.card.tcgId ?? `sv3pt5-${userCard.card.pokemonId}`;
            await tx.$executeRaw `
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
    async history(userId) {
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
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cards_service_1.CardsService,
        paypal_client_1.PaypalClient])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map