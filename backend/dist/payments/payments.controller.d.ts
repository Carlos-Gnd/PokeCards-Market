import { PaymentsService } from './payments.service';
import type { SessionUser } from '../auth/current-user.decorator';
import { CreateOrderDto, CaptureOrderDto } from './dto';
export declare class PaymentsController {
    private readonly payments;
    constructor(payments: PaymentsService);
    create(user: SessionUser, dto: CreateOrderDto): Promise<{
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
    capture(user: SessionUser, dto: CaptureOrderDto): Promise<{
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
    history(user: SessionUser): Promise<{
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
