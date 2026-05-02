import { PrismaService } from '../prisma/prisma.service';
import { CardsService } from '../cards/cards.service';
import { PaypalClient } from './paypal.client';
export declare class PaymentsService {
    private readonly prisma;
    private readonly cards;
    private readonly paypal;
    private readonly logger;
    constructor(prisma: PrismaService, cards: CardsService, paypal: PaypalClient);
    createOrder(userId: string, pokemonId: number): Promise<{
        paypalOrderId: string;
        approveUrl: any;
        amount: string;
        card: {
            id: number;
            pokemonId: number;
            name: string;
            rarity: string;
            variant: string;
        };
    }>;
    captureOrder(userId: string, paypalOrderId: string): Promise<{
        alreadyCaptured: boolean;
        userCard: ({
            card: {
                id: bigint;
                pokemonId: number;
                name: string;
                type: string;
                secondaryType: string | null;
                rarity: string;
                variant: string;
                imageUrl: string;
                marketPrice: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orderId: string | null;
            userId: string;
            cardId: bigint;
            quantity: number;
            obtainedFrom: string;
        }) | null;
        success?: undefined;
        paypalOrderId?: undefined;
        amount?: undefined;
    } | {
        success: boolean;
        paypalOrderId: string;
        amount: number;
        userCard: {
            cardId: number;
            card: {
                id: number;
                marketPrice: number;
                pokemonId: number;
                name: string;
                type: string;
                secondaryType: string | null;
                rarity: string;
                variant: string;
                imageUrl: string;
                createdAt: Date;
                updatedAt: Date;
            };
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orderId: string | null;
            userId: string;
            quantity: number;
            obtainedFrom: string;
        };
        alreadyCaptured?: undefined;
    }>;
    history(userId: string): Promise<{
        cardId: number;
        amount: number;
        card: {
            id: number;
            marketPrice: number;
            pokemonId: number;
            name: string;
            type: string;
            secondaryType: string | null;
            rarity: string;
            variant: string;
            imageUrl: string;
            createdAt: Date;
            updatedAt: Date;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        paypalOrderId: string;
        status: string;
    }[]>;
}
