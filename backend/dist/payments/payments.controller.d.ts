import { PaymentsService } from './payments.service';
import type { SessionUser } from '../auth/current-user.decorator';
import { CreateOrderDto, CaptureOrderDto } from './dto';
export declare class PaymentsController {
    private readonly payments;
    constructor(payments: PaymentsService);
    create(user: SessionUser, dto: CreateOrderDto): Promise<{
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
    capture(user: SessionUser, dto: CaptureOrderDto): Promise<{
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
    history(user: SessionUser): Promise<{
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
