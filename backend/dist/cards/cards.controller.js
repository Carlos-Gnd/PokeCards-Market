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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardsController = void 0;
const common_1 = require("@nestjs/common");
const cards_service_1 = require("./cards.service");
let CardsController = class CardsController {
    cards;
    constructor(cards) {
        this.cards = cards;
    }
    async list(rawPage = '1', rawLimit = '48', q) {
        const page = Math.max(1, parseInt(rawPage, 10) || 1);
        const limit = Math.min(96, Math.max(12, parseInt(rawLimit, 10) || 48));
        return this.cards.listPaginated({ page, limit, ...q });
    }
    async trending() {
        const cards = await this.cards.listTrending();
        return { cards };
    }
    async one(tcgId) {
        return this.cards.getOne(tcgId);
    }
};
exports.CardsController = CardsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.Header)('Cache-Control', 'public, max-age=60, stale-while-revalidate=300'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('trending'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=60, stale-while-revalidate=300'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "trending", null);
__decorate([
    (0, common_1.Get)(':tcgId'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=300'),
    __param(0, (0, common_1.Param)('tcgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CardsController.prototype, "one", null);
exports.CardsController = CardsController = __decorate([
    (0, common_1.Controller)('cards'),
    __metadata("design:paramtypes", [cards_service_1.CardsService])
], CardsController);
//# sourceMappingURL=cards.controller.js.map