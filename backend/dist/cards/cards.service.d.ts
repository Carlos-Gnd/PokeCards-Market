import { PrismaService } from '../prisma/prisma.service';
import { PokeapiService, PokeCard } from './pokeapi.service';
export declare class CardsService {
    private readonly poke;
    private readonly prisma;
    constructor(poke: PokeapiService, prisma: PrismaService);
    listPaginated(q: {
        page: number;
        limit: number;
        rarity?: string;
        type?: string;
        search?: string;
        sort?: string;
    }): Promise<{
        count: number;
        page: number;
        limit: number;
        totalPages: number;
        cards: PokeCard[];
    }>;
    listTrending(): Promise<PokeCard[]>;
    listAll(): Promise<PokeCard[]>;
    getOne(tcgId: string): Promise<PokeCard>;
    ensureInDb(tcgId: string): Promise<{
        id: bigint;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        rarity: string;
        type: string;
        tcgId: string | null;
        pokemonId: number;
        secondaryType: string | null;
        variant: string;
        imageUrl: string;
        marketPrice: import("@prisma/client/runtime/library").Decimal;
    }>;
    toPublic(card: PokeCard): PokeCard;
}
