"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VARIANTS = exports.RARITY_TABLE = void 0;
exports.variantFor = variantFor;
exports.priceFor = priceFor;
exports.RARITY_TABLE = [
    { tier: 'core', label: 'Core', dropRate: 50.0, basePrice: 1 },
    { tier: 'alloy', label: 'Alloy', dropRate: 25.0, basePrice: 2 },
    { tier: 'prime', label: 'Prime', dropRate: 12.0, basePrice: 4 },
    { tier: 'elite', label: 'Elite', dropRate: 7.0, basePrice: 8 },
    { tier: 'apex', label: 'Apex', dropRate: 4.0, basePrice: 15 },
    { tier: 'ascendant', label: 'Ascendant', dropRate: 1.8, basePrice: 25 },
    { tier: 'eternal', label: 'Eternal', dropRate: 0.2, basePrice: 50 },
];
exports.VARIANTS = [
    { variant: 'standard', label: 'Standard' },
    { variant: 'luminous', label: 'Luminous' },
    { variant: 'signature', label: 'Signature' },
    { variant: 'prestige', label: 'Prestige' },
    { variant: 'spectrum', label: 'Spectrum' },
    { variant: 'vaulted', label: 'Vaulted' },
];
const FORCED_TIERS = {
    151: 'eternal',
    150: 'eternal',
    144: 'ascendant',
    145: 'ascendant',
    146: 'ascendant',
    149: 'ascendant',
    130: 'apex',
    6: 'apex',
    9: 'apex',
    3: 'apex',
    248: 'apex',
    94: 'elite',
    131: 'elite',
    143: 'elite',
    142: 'elite',
    25: 'prime',
    26: 'elite',
    133: 'prime',
};
function det01(seed) {
    let t = (seed + 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function variantFor(pokemonId, tier) {
    const roll = det01(pokemonId * 7919 + 1031);
    if (tier === 'eternal')
        return 'prestige';
    if (tier === 'ascendant')
        return roll < 0.5 ? 'spectrum' : 'signature';
    if (tier === 'apex')
        return roll < 0.4 ? 'signature' : 'luminous';
    if (tier === 'elite')
        return roll < 0.5 ? 'luminous' : 'standard';
    if (tier === 'prime')
        return roll < 0.3 ? 'luminous' : 'standard';
    return 'standard';
}
const VARIANT_MULT = {
    standard: 1.0,
    luminous: 1.4,
    signature: 1.8,
    prestige: 2.5,
    spectrum: 2.2,
    vaulted: 3.0,
};
function priceFor(pokemonId, tier, variant) {
    const base = exports.RARITY_TABLE.find((r) => r.tier === tier).basePrice;
    const noise = 0.85 + det01(pokemonId * 31337 + 17) * 0.3;
    return Math.round(base * VARIANT_MULT[variant] * noise * 100) / 100;
}
//# sourceMappingURL=rarity.util.js.map