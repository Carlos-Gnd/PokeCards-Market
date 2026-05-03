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
        approveUrl: string | undefined;
        amount: string;
        card: {
            id: number;
            pokemonId: number;
            name: string;
            rarity: string;
            variant: string;
        };
    }>;
    private toPublicUserCard;
    captureOrder(userId: string, paypalOrderId: string): Promise<{
        alreadyCaptured: boolean;
        userCard: {
            id: string;
            quantity: number;
            obtainedFrom: string;
            acquiredAt: Date;
            cardId: number;
            card: {
                id: number;
                pokemonId: number;
                name: string;
                type: string;
                secondaryType: string | null;
                rarity: string;
                variant: string;
                imageUrl: string;
                marketPrice: number;
            };
        } | null;
        success?: undefined;
        paypalOrderId?: undefined;
        amount?: undefined;
    } | {
        success: boolean;
        paypalOrderId: string;
        amount: number;
        userCard: {
            id: string;
            quantity: number;
            obtainedFrom: string;
            acquiredAt: Date;
            cardId: number;
            card: {
                id: number;
                pokemonId: number;
                name: string;
                type: string;
                secondaryType: string | null;
                rarity: string;
                variant: string;
                imageUrl: string;
                marketPrice: number;
            };
        };
        alreadyCaptured?: undefined;
    }>;
    history(userId: string): Promise<{
        id: string;
        paypalOrderId: string;
        status: string;
        amount: number;
        createdAt: Date;
        updatedAt: Date;
        cardId: number;
        card: {
            id: number;
            pokemonId: number;
            name: string;
            type: string;
            rarity: string;
            variant: string;
            imageUrl: string;
            marketPrice: number;
        };
    }[]>;
}
