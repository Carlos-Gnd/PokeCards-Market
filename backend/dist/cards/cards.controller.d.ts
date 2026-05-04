import { CardsService } from './cards.service';
export declare class CardsController {
    private readonly cards;
    constructor(cards: CardsService);
    list(): Promise<{
        count: number;
        cards: import("./pokeapi.service").PokeCard[];
    }>;
    trending(): Promise<{
        cards: import("./pokeapi.service").PokeCard[];
    }>;
    one(tcgId: string): Promise<import("./pokeapi.service").PokeCard>;
}
