import { CardsService } from './cards.service';
export interface CardListQuery {
    rarity?: string;
    type?: string;
    search?: string;
    sort?: string;
}
export declare class CardsController {
    private readonly cards;
    constructor(cards: CardsService);
    list(rawPage?: string, rawLimit?: string, rarity?: string, type?: string, search?: string, sort?: string): Promise<{
        count: number;
        page: number;
        limit: number;
        totalPages: number;
        cards: import("./pokeapi.service").PokeCard[];
    }>;
    trending(): Promise<{
        cards: import("./pokeapi.service").PokeCard[];
    }>;
    one(tcgId: string): Promise<import("./pokeapi.service").PokeCard>;
}
