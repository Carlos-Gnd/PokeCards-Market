export interface ArcadiumCard {
  pokemonId: number;
  tcgId: string;
  setId: string; // para los filtros de expansiones
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
  id: string; // Este es el UUID de la compra en la tabla user_cards, se queda igual
  quantity: number;
  obtainedFrom: string;
  acquiredAt: string;
  card: {
    pokemonId: number;
    tcgId: string;
    setId: string;
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
    pokemonId: number;
    tcgId: string;
    setId: string;
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
