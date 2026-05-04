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
exports.CollectionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CollectionService = class CollectionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listForUser(userId) {
        const items = await this.prisma.userCard.findMany({
            where: { userId },
            include: { card: true },
            orderBy: { createdAt: 'desc' },
        });
        return items.map((uc) => ({
            id: uc.id,
            quantity: uc.quantity,
            obtainedFrom: uc.obtainedFrom,
            acquiredAt: uc.createdAt,
            card: {
                id: Number(uc.card.id),
                pokemonId: uc.card.pokemonId,
                tcgId: uc.card.tcgId,
                name: uc.card.name,
                type: uc.card.type,
                secondaryType: uc.card.secondaryType,
                rarity: uc.card.rarity,
                variant: uc.card.variant,
                imageUrl: uc.card.imageUrl,
                marketPrice: Number(uc.card.marketPrice),
            },
        }));
    }
    async ownedPokemonIds(userId) {
        const items = await this.prisma.userCard.findMany({
            where: { userId },
            include: { card: { select: { pokemonId: true } } },
        });
        return items.map((i) => i.card.pokemonId);
    }
};
exports.CollectionService = CollectionService;
exports.CollectionService = CollectionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CollectionService);
//# sourceMappingURL=collection.service.js.map