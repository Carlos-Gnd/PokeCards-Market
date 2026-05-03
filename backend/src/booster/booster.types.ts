/**
 * Carta tal como viene de la tabla `cartas_pokemon` (legacy express-api schema).
 * Esta tabla NO está en el schema Prisma — se accede con $queryRaw.
 */
export interface BoosterCard {
  id: string;
  nombre: string;
  pokedexNumero: number | null;
  rareza: string | null;
  tipo: string | null;
  imagenSmall: string | null;
  imagenLarge: string | null;
  precioMercado: number;
  esRara: boolean;
}

/** Shape crudo de una fila de `cartas_pokemon` devuelta por $queryRaw. */
export interface CartasPokemonRow {
  id: string;
  nombre: string;
  pokedex_numero: number | null;
  rareza: string | null;
  tipo: string | null;
  imagen_small: string | null;
  imagen_large: string | null;
  /** Prisma devuelve Decimal como string cuando viene de $queryRaw. */
  precio_mercado: string | number;
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

/** Fila de idempotencia en colecciones_usuario. */
export interface ColeccionesUsuarioIdRow {
  carta_id: string;
}
