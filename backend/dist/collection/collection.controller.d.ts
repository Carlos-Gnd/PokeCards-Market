import { CollectionService } from './collection.service';
import type { SessionUser } from '../auth/current-user.decorator';
export declare class CollectionController {
    private readonly collection;
    constructor(collection: CollectionService);
    list(user: SessionUser): Promise<{
        id: string;
        quantity: number;
        obtainedFrom: string;
        acquiredAt: Date;
        card: {
            id: number;
            pokemonId: number;
            tcgId: string | null;
            name: string;
            type: string;
            secondaryType: string | null;
            rarity: string;
            variant: string;
            imageUrl: string;
            marketPrice: number;
        };
    }[]>;
    ownedIds(user: SessionUser): Promise<number[]>;
}
