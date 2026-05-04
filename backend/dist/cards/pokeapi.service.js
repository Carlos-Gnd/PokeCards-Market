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
var PokeapiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokeapiService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const rarity_util_1 = require("./rarity.util");
const RARITY_TO_TIER = {
    Common: { tier: 'core', label: 'Common' },
    Uncommon: { tier: 'alloy', label: 'Uncommon' },
    Rare: { tier: 'prime', label: 'Rare' },
    'Double Rare': { tier: 'elite', label: 'Double Rare' },
    'Ultra Rare': { tier: 'apex', label: 'Ultra Rare' },
    'Illustration Rare': { tier: 'apex', label: 'Illustration Rare' },
    'Special Illustration Rare': { tier: 'ascendant', label: 'Special Illustration Rare' },
    'Hyper Rare': { tier: 'eternal', label: 'Hyper Rare' },
    'Rare Holo': { tier: 'prime', label: 'Rare Holo' },
    'Rare Holo EX': { tier: 'apex', label: 'Rare Holo EX' },
    'Rare Holo GX': { tier: 'apex', label: 'Rare Holo GX' },
    'Rare Holo LV.X': { tier: 'apex', label: 'Rare Holo LV.X' },
    'Rare Holo Star': { tier: 'ascendant', label: 'Rare Holo Star' },
    'Rare Holo V': { tier: 'elite', label: 'Rare Holo V' },
    'Rare Holo VMAX': { tier: 'apex', label: 'Rare Holo VMAX' },
    'Rare Holo VSTAR': { tier: 'apex', label: 'Rare Holo VSTAR' },
    'Rare Ultra': { tier: 'apex', label: 'Rare Ultra' },
    'Rare Secret': { tier: 'ascendant', label: 'Rare Secret' },
    'Rare Rainbow': { tier: 'ascendant', label: 'Rare Rainbow' },
    'Rare Prism Star': { tier: 'elite', label: 'Rare Prism Star' },
    'Rare Shiny': { tier: 'elite', label: 'Rare Shiny' },
    'Rare Shiny GX': { tier: 'ascendant', label: 'Rare Shiny GX' },
    'Rare BREAK': { tier: 'elite', label: 'Rare BREAK' },
    'Amazing Rare': { tier: 'apex', label: 'Amazing Rare' },
    'LEGEND': { tier: 'ascendant', label: 'LEGEND' },
};
const TIER_ORDER = {
    eternal: 7,
    ascendant: 6,
    apex: 5,
    elite: 4,
    prime: 3,
    alloy: 2,
    core: 1,
};
function det01(seed) {
    let t = (seed + 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function pokemonIdFromCardId(cardId) {
    const tail = cardId.split('-').pop();
    const n = tail ? Number.parseInt(tail, 10) : NaN;
    return Number.isFinite(n) ? n : 0;
}
let PokeapiService = PokeapiService_1 = class PokeapiService {
    prisma;
    logger = new common_1.Logger(PokeapiService_1.name);
    cache = null;
    cacheAt = 0;
    inflightCatalog = null;
    TTL_MS = 1000 * 60 * 5;
    constructor(prisma) {
        this.prisma = prisma;
    }
    invalidate() {
        this.cache = null;
        this.cacheAt = 0;
    }
    mapRow(row) {
        const pokemonId = pokemonIdFromCardId(row.id);
        const tierInfo = (row.rareza ? RARITY_TO_TIER[row.rareza] : undefined) ?? {
            tier: 'core',
            label: row.rareza ?? 'Sin clasificar',
        };
        const variant = (0, rarity_util_1.variantFor)(pokemonId, tierInfo.tier);
        const seed = pokemonId || row.id.length;
        const stats = {
            hp: 50 + Math.floor(det01(seed * 7) * 200),
            attack: 40 + Math.floor(det01(seed * 11) * 130),
            defense: 40 + Math.floor(det01(seed * 13) * 110),
            speed: 30 + Math.floor(det01(seed * 17) * 130),
        };
        return {
            pokemonId,
            tcgId: row.id,
            name: row.nombre,
            type: row.tipo ?? 'Colorless',
            secondaryType: null,
            rarity: tierInfo.tier,
            rarityLabel: tierInfo.label,
            variant,
            imageUrl: row.imagen_large ?? row.imagen_small ?? '',
            marketPrice: Number(row.precio_mercado),
            stats,
            height: 0,
            weight: 0,
            abilities: [],
        };
    }
    async getCatalog() {
        const now = Date.now();
        if (this.cache && now - this.cacheAt < this.TTL_MS)
            return this.cache;
        if (this.inflightCatalog)
            return this.inflightCatalog;
        this.inflightCatalog = (async () => {
            const t0 = Date.now();
            const rows = await this.prisma.$queryRaw `
        SELECT id, nombre, pokedex_numero, rareza, tipo, imagen_small, imagen_large, precio_mercado
        FROM cartas_pokemon
      `;
            const cards = rows.map((r) => this.mapRow(r));
            cards.sort((a, b) => {
                const r = (TIER_ORDER[b.rarity] ?? 0) - (TIER_ORDER[a.rarity] ?? 0);
                if (r !== 0)
                    return r;
                return b.marketPrice - a.marketPrice;
            });
            this.cache = cards;
            this.cacheAt = Date.now();
            this.logger.log(`Catálogo cargado desde Supabase: ${cards.length} cartas en ${Date.now() - t0}ms`);
            return cards;
        })();
        try {
            return await this.inflightCatalog;
        }
        finally {
            this.inflightCatalog = null;
        }
    }
    async warmup() {
        this.getCatalog().catch((err) => this.logger.warn(`Warmup falló: ${err.message}`));
    }
    async findOne(tcgId) {
        const cat = await this.getCatalog();
        return cat.find((c) => c.tcgId === tcgId) ?? null;
    }
};
exports.PokeapiService = PokeapiService;
exports.PokeapiService = PokeapiService = PokeapiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PokeapiService);
//# sourceMappingURL=pokeapi.service.js.map