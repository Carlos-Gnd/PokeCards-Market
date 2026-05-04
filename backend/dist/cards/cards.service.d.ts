import { PrismaService } from '../prisma/prisma.service';
import { PokeapiService, PokeCard } from './pokeapi.service';
import { Prisma } from '@prisma/client';
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
        tcgId: string | null;
        pokemonId: number;
        name: string;
        type: string;
        secondaryType: string | null;
        rarity: string;
        variant: string;
        imageUrl: string;
        marketPrice: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    toPublic(card: PokeCard): PokeCard;
}
