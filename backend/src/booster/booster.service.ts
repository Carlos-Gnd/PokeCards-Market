import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PaypalClient } from '../payments/paypal.client';
import type {
  BoosterCard,
  BoosterCaptureResult,
  BoosterPack,
  CartasPokemonRow,
  ColeccionesUsuarioIdRow,
} from './booster.types';

const HIGH_RARITIES: readonly string[] = [
  'Illustration Rare',
  'Ultra Rare',
  'Special Illustration Rare',
  'Hyper Rare',
  'Double Rare',
];
const HIGH_PRICE_THRESHOLD = 5.0;

@Injectable()
export class BoosterService {
  private readonly logger = new Logger(BoosterService.name);
  private readonly price: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paypal: PaypalClient,
    private readonly config: ConfigService,
  ) {
    this.price = Number(
      this.config.get<string>('BOOSTER_PACK_PRICE_USD') ?? '4.99',
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Endpoints públicos
  // ────────────────────────────────────────────────────────────────────────────

  /** Demo sin pago — devuelve un pack aleatorio sin registrar nada. */
  async openDemo(): Promise<BoosterPack> {
    const pack = await this.pickRandomPack();
    return {
      precio: this.price,
      moneda: 'USD',
      cartas: pack.cards,
      cartaGarantizadaId: pack.guaranteedId,
    };
  }

  /** Crea una orden PayPal por el precio del sobre. */
  async createOrder(): Promise<{
    paypalOrderId: string;
    amount: string;
    currency: string;
  }> {
    if (!this.paypal.isReady()) {
      throw new ServiceUnavailableException(
        'PayPal no está configurado en el servidor',
      );
    }
    try {
      const order = await this.paypal.createOrder(
        this.price,
        'arcadium_booster_prismatic',
        'ARCADIUM · Sobre Pokémon TCG Prismatic Evolutions (5 cartas)',
      );
      return {
        paypalOrderId: order.id,
        amount: this.price.toFixed(2),
        currency: 'USD',
      };
    } catch (err: unknown) {
      this.logger.error(
        'Error creando orden de PayPal',
        err instanceof Error ? err.message : err,
      );
      throw new InternalServerErrorException(
        'No se pudo crear la orden de PayPal',
      );
    }
  }

  /**
   * Captura la orden PayPal, genera el pack y persiste si hay userId.
   * Implementa idempotencia: si la orden ya fue capturada devuelve 409.
   */
  async captureOrder(
    paypalOrderId: string,
    userId?: string,
  ): Promise<BoosterCaptureResult> {
    if (!this.paypal.isReady()) {
      throw new ServiceUnavailableException(
        'PayPal no está configurado en el servidor',
      );
    }

    // Idempotencia — si ya tenemos filas para este paypal_order_id, no doble-capturamos.
    const existing = await this.prisma.$queryRaw<ColeccionesUsuarioIdRow[]>`
      SELECT carta_id FROM colecciones_usuario
      WHERE paypal_order_id = ${paypalOrderId}
      LIMIT 1
    `;
    if (existing.length > 0) {
      throw new ConflictException('Orden ya capturada anteriormente');
    }

    let captureStatus: string;
    try {
      const result = await this.paypal.captureOrder(paypalOrderId);
      captureStatus = result.status;
    } catch (err: unknown) {
      this.logger.error(
        'Error capturando orden PayPal',
        err instanceof Error ? err.message : err,
      );
      throw new InternalServerErrorException(
        'No se pudo capturar la orden de PayPal',
      );
    }

    if (captureStatus !== 'COMPLETED') {
      throw new InternalServerErrorException(
        `Pago no completado (estado: ${captureStatus})`,
      );
    }

    const pack = await this.pickRandomPack();
    await this.persistPack({ userId, paypalOrderId, cards: pack.cards });

    return {
      success: true,
      paypalOrderId,
      precio: this.price,
      moneda: 'USD',
      cartas: pack.cards,
      cartaGarantizadaId: pack.guaranteedId,
      persisted: Boolean(userId),
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Helpers privados
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Selecciona 5 cartas aleatorias garantizando al menos 1 rara.
   * Accede a `cartas_pokemon` con $queryRaw porque la tabla no está en el
   * schema Prisma (es el esquema legacy del express-api, mantenido tal cual).
   */
  private async pickRandomPack(): Promise<{
    cards: BoosterCard[];
    guaranteedId: string;
  }> {
    // Una carta garantizada de rareza alta
    const rareRows = await this.prisma.$queryRaw<CartasPokemonRow[]>`
      SELECT id, nombre, pokedex_numero, rareza, tipo, imagen_small, imagen_large, precio_mercado
      FROM cartas_pokemon
      WHERE rareza = ANY(${HIGH_RARITIES}::text[])
         OR precio_mercado::numeric > ${HIGH_PRICE_THRESHOLD}
      ORDER BY RANDOM()
      LIMIT 1
    `;

    if (rareRows.length === 0) {
      throw new InternalServerErrorException(
        'No hay cartas raras disponibles. Ejecuta el seed: cd express-api && node seed.js',
      );
    }
    const rareRow = rareRows[0];

    // Cuatro cartas de relleno (sin repetir la rara)
    const fillRows = await this.prisma.$queryRaw<CartasPokemonRow[]>`
      SELECT id, nombre, pokedex_numero, rareza, tipo, imagen_small, imagen_large, precio_mercado
      FROM cartas_pokemon
      WHERE id <> ${rareRow.id}
      ORDER BY RANDOM()
      LIMIT 4
    `;

    const cards = [...fillRows, rareRow]
      .sort(() => Math.random() - 0.5)
      .map((row) => this.rowToCard(row));

    return { cards, guaranteedId: rareRow.id };
  }

  /**
   * Persiste las cartas del pack en colecciones_usuario.
   * Si userId es undefined (usuario anónimo / demo), no hace nada.
   */
  private async persistPack({
    userId,
    paypalOrderId,
    cards,
  }: {
    userId: string | undefined;
    paypalOrderId: string;
    cards: BoosterCard[];
  }): Promise<void> {
    if (!userId) return;

    for (const card of cards) {
      await this.prisma.$executeRaw`
        INSERT INTO colecciones_usuario (user_id, carta_id, paypal_order_id, obtenida_de)
        VALUES (${userId}, ${card.id}, ${paypalOrderId}, 'booster')
        ON CONFLICT DO NOTHING
      `;
    }
  }

  /** Convierte una fila raw de `cartas_pokemon` al shape público `BoosterCard`. */
  private rowToCard(row: CartasPokemonRow): BoosterCard {
    return {
      id: row.id,
      nombre: row.nombre,
      pokedexNumero: row.pokedex_numero,
      rareza: row.rareza,
      tipo: row.tipo,
      imagenSmall: row.imagen_small,
      imagenLarge: row.imagen_large,
      precioMercado: Number(row.precio_mercado),
      esRara:
        (row.rareza !== null && HIGH_RARITIES.includes(row.rareza)) ||
        Number(row.precio_mercado) > HIGH_PRICE_THRESHOLD,
    };
  }
}
