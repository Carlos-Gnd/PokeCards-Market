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
        const where = {};
        if (rarity)
            where.rarity = rarity;
        if (type)
            where.OR = [{ type }, { secondaryType: type }];
        if (search)
            where.name = { contains: search, mode: 'insensitive' };
        let orderBy = [
            { marketPrice: 'desc' },
        ];
        switch (sort) {
            case 'price-asc':
                orderBy = [{ marketPrice: 'asc' }];
                break;
            case 'price-desc':
                orderBy = [{ marketPrice: 'desc' }];
                break;
            case 'name-asc':
                orderBy = [{ name: 'asc' }];
                break;
            case 'rarity-desc':
                orderBy = [{ marketPrice: 'desc' }];
                break;
            case 'rarity-asc':
                orderBy = [{ marketPrice: 'asc' }];
                break;
        }
        const [total, cards] = await Promise.all([
            this.prisma.card.count({ where }),
            this.prisma.card.findMany({
                where,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        const mapped = cards.map((c) => this.poke.rowToPokeCard(c));
        return {
            count: total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            cards: mapped,
        };
    }
    async listTrending() {
        const cards = await this.prisma.card.findMany({
            orderBy: { marketPrice: 'desc' },
            take: 8,
        });
        return cards.map((c) => this.poke.rowToPokeCard(c));
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