import { PrismaService } from '../prisma/prisma.service';
import { PokeapiService, PokeCard } from './pokeapi.service';
export declare class CardsService {
    private readonly poke;
    private readonly prisma;
    constructor(poke: PokeapiService, prisma: PrismaService);
    listAll(): Promise<PokeCard[]>;
    getOne(pokemonId: number): Promise<PokeCard>;
    ensureInDb(pokemonId: number): Promise<{
        id: bigint;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        pokemonId: number;
        type: string;
        secondaryType: string | null;
        rarity: string;
        variant: string;
        imageUrl: string;
        marketPrice: import("@prisma/client/runtime/library").Decimal;
    }>;
    toPublic(card: PokeCard): PokeCard;
}
