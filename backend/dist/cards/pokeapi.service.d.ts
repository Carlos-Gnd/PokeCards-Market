import { PrismaService } from '../prisma/prisma.service';
export interface PokeCard {
    pokemonId: number;
    tcgId: string;
    name: string;
    type: string;
    secondaryType: string | null;
    rarity: string;
    rarityLabel: string;
    variant: string;
    imageUrl: string;
    marketPrice: number;
    stats: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
    };
    height: number;
    weight: number;
    abilities: string[];
}
export declare class PokeapiService {
    private readonly prisma;
    private readonly logger;
    private cache;
    private cacheAt;
    private inflightCatalog;
    private readonly TTL_MS;
    constructor(prisma: PrismaService);
    invalidate(): void;
    private mapRow;
    getCatalog(): Promise<PokeCard[]>;
    warmup(): Promise<void>;
    findOne(tcgId: string): Promise<PokeCard | null>;
}
