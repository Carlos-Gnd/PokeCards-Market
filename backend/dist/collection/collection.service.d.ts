import { PrismaService } from '../prisma/prisma.service';
export declare class CollectionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listForUser(userId: string): Promise<{
        id: string;
        quantity: number;
        obtainedFrom: string;
        acquiredAt: Date;
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
    }[]>;
    ownedPokemonIds(userId: string): Promise<number[]>;
}
