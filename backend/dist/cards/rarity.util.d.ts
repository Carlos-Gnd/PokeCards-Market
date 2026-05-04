export type RarityTier = 'core' | 'alloy' | 'prime' | 'elite' | 'apex' | 'ascendant' | 'eternal';
export type CardVariant = 'standard' | 'luminous' | 'signature' | 'prestige' | 'spectrum' | 'vaulted';
export interface RarityDef {
    tier: RarityTier;
    label: string;
    dropRate: number;
    basePrice: number;
}
export declare const RARITY_TABLE: RarityDef[];
export declare const VARIANTS: {
    variant: CardVariant;
    label: string;
}[];
export declare function variantFor(pokemonId: number, tier: RarityTier): CardVariant;
export declare function priceFor(pokemonId: number, tier: RarityTier, variant: CardVariant): number;
