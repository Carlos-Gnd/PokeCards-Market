// ── backend/src/booster/booster.types.ts — v2.0 ──────────────────────────────
// Las interfaces legacy CartasPokemonRow / ColeccionesUsuarioIdRow se eliminan.
// BoosterCard ahora refleja el shape de la tabla `cards` gestionada por Prisma.

/**
 * Carta tal como se expone en un booster pack.
 * Coincide 1:1 con PokeCard para que el frontend no necesite cambios.
 */
export interface BoosterCard {
  tcgId: string; // tcgId  (ej. "sv4pt5-25")
  setId: string;
  nombre: string;
  pokemonId: number;
  rareza: string; // tier interno (core, alloy, prime…)
  rarityLabel: string;
  tipo: string;
  imagenSmall: string;
  imagenLarge: string;
  precioMercado: number;
  stats: { hp: number; attack: number; defense: number; speed: number };
  esRara: boolean;
}

/** Respuesta del endpoint de abrir sobre. */
export interface BoosterPack {
  precio: number;
  moneda: 'USD';
  cartas: BoosterCard[];
  cartaGarantizadaId: string;
}

/** Respuesta extendida del capture-order. */
export interface BoosterCaptureResult extends BoosterPack {
  success: boolean;
  paypalOrderId: string;
  persisted: boolean;
  alreadyCaptured?: boolean;
}
