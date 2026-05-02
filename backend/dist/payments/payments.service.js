"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const paypal = __importStar(require("@paypal/checkout-server-sdk"));
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
    async createOrder(userId, pokemonId) {
        const card = await this.cards.ensureInDb(pokemonId);
        const owned = await this.prisma.userCard.findUnique({
            where: { userId_cardId: { userId, cardId: card.id } },
        });
        if (owned) {
            throw new common_1.ConflictException('Ya posees esta carta en tu colección');
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
        }
        catch (err) {
            this.logger.error(`PayPal create-order falló: ${err.message}`);
            throw new common_1.BadRequestException('No se pudo crear la orden de PayPal');
        }
        const paypalOrderId = response.result.id;
        const approve = (response.result.links ?? []).find((l) => l.rel === 'approve');
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
    async captureOrder(userId, paypalOrderId) {
        const order = await this.prisma.order.findUnique({ where: { paypalOrderId } });
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
            return { alreadyCaptured: true, userCard };
        }
        const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
        request.requestBody({});
        let response;
        try {
            response = await this.paypal.http.execute(request);
        }
        catch (err) {
            this.logger.error(`PayPal capture-order falló: ${err.message}`);
            await this.prisma.order.update({
                where: { paypalOrderId },
                data: { status: 'FAILED' },
            });
            throw new common_1.BadRequestException('La captura del pago falló en PayPal');
        }
        const status = response.result.status;
        if (status !== 'COMPLETED') {
            await this.prisma.order.update({
                where: { paypalOrderId },
                data: { status: status || 'FAILED' },
            });
            throw new common_1.BadRequestException(`Pago no completado (estado: ${status})`);
        }
        const capture = response.result.purchase_units?.[0]?.payments?.captures?.[0];
        const capturedAmount = Number(capture?.amount?.value ?? 0);
        if (Math.abs(capturedAmount - Number(order.amount)) > 0.01) {
            this.logger.warn(`Monto capturado (${capturedAmount}) ≠ orden (${order.amount})`);
            throw new common_1.BadRequestException('El monto capturado no coincide');
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
            const cartaPokemonId = `sv3pt5-${userCard.card.pokemonId}`;
            await tx.$executeRaw `
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
    async history(userId) {
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
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cards_service_1.CardsService,
        paypal_client_1.PaypalClient])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map