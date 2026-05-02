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
    async listAll() {
        return this.poke.getCatalog();
    }
    async getOne(pokemonId) {
        const card = await this.poke.findOne(pokemonId);
        if (!card)
            throw new common_1.NotFoundException('Carta no encontrada');
        return card;
    }
    async ensureInDb(pokemonId) {
        const card = await this.getOne(pokemonId);
        return this.prisma.card.upsert({
            where: { pokemonId: card.pokemonId },
            update: {
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