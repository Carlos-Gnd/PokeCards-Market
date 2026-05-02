export interface ArcadiumCard {
  pokemonId: number;
  name: string;
  type: string;
  secondaryType: string | null;
  rarity: string;
  rarityLabel: string;
  variant: string;
  imageUrl: string;
  marketPrice: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  height: number;
  weight: number;
  abilities: string[];
}

export interface UserCardEntry {
  id: string;
  quantity: number;
  obtainedFrom: string;
  acquiredAt: string;
  card: {
    id: number;
    pokemonId: number;
    name: string;
    type: string;
    secondaryType: string | null;
    rarity: string;
    variant: string;
    imageUrl: string;
    marketPrice: number;
  };
}

export interface CreateOrderResponse {
  paypalOrderId: string;
  approveUrl?: string;
  amount: string;
  card: {
    id: number;
    pokemonId: number;
    name: string;
    rarity: string;
    variant: string;
  };
}

export interface CaptureOrderResponse {
  success?: boolean;
  alreadyCaptured?: boolean;
  paypalOrderId?: string;
  amount?: number;
  userCard?: UserCardEntry;
}
