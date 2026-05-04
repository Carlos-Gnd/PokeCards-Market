"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pokeapi_service_1 = require("./pokeapi.service");
let CardsService = class CardsService {
    poke;
    prisma;
    constructor(poke, prisma) {
        this.poke = poke;
        this.prisma = prisma;
    }
    async listPaginated(q) {
        const { page, limit, rarity, type, search, sort } = q;
        let allCards = await this.poke.getCatalog();
        if (rarity) {
            allCards = allCards.filter((c) => c.rarity === rarity);
        }
        if (type) {
            allCards = allCards.filter((c) => c.type === type || c.secondaryType === type);
        }
        if (search) {
            const s = search.toLowerCase();
            allCards = allCards.filter((c) => c.name.toLowerCase().includes(s));
        }
        allCards.sort((a, b) => {
            switch (sort) {
                case 'price-asc':
                    return a.marketPrice - b.marketPrice;
                case 'price-desc':
                    return b.marketPrice - a.marketPrice;
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'rarity-desc':
                    return b.marketPrice - a.marketPrice;
                case 'rarity-asc':
                    return a.marketPrice - b.marketPrice;
                default:
                    return 0;
            }
        });
        const total = allCards.length;
        const startIndex = (page - 1) * limit;
        const paginatedCards = allCards.slice(startIndex, startIndex + limit);
        return {
            count: total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            cards: paginatedCards,
        };
    }
    async listTrending() {
        const allCards = await this.poke.getCatalog();
        const sorted = [...allCards].sort((a, b) => b.marketPrice - a.marketPrice);
        return sorted.slice(0, 8);
    }
    async listAll() {
        return this.poke.getCatalog();
    }
    async getOne(tcgId) {
        const card = await this.poke.findOne(tcgId);
        if (!card)
            throw new common_1.NotFoundException('Carta no encontrada');
        return card;
    }
    async ensureInDb(tcgId) {
        const card = await this.getOne(tcgId);
        return this.prisma.card.upsert({
            where: { tcgId: card.tcgId },
            update: {
                pokemonId: card.pokemonId,
                name: card.name,
                type: card.type,
                secondaryType: card.secondaryType,
                rarity: card.rarity,
                variant: card.variant,
                imageUrl: card.imageUrl,
                marketPrice: card.marketPrice,
            },
            create: {
                pokemonId: card.pokemonId,
                tcgId: card.tcgId,
                name: card.name,
                type: card.type,
                secondaryType: card.secondaryType,
                rarity: card.rarity,
                variant: card.variant,
                imageUrl: card.imageUrl,
                marketPrice: card.marketPrice,
            },
        });
    }
    toPublic(card) {
        return card;
    }
};
exports.CardsService = CardsService;
exports.CardsService = CardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pokeapi_service_1.PokeapiService,
        prisma_service_1.PrismaService])
], CardsService);
//# sourceMappingURL=cards.service.js.map