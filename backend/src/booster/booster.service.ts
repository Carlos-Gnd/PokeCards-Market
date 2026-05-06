// ── backend/src/booster/booster.service.ts — v2.0 ────────────────────────────
// Ya no accede a cartas_pokemon ni colecciones_usuario.
// Todo pasa por la tabla `cards` (Prisma SSOT) y `user_cards`.
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
} from './booster.types';
import { CardsService } from '../cards/cards.service';
import type { Card } from '@prisma/client';

// Rarezas que garantizan "carta rara" en el sobre
const HIGH_RARITY_TIERS: readonly string[] = ['apex', 'ascendant', 'eternal'];
// En rarityLabel (valor original TCG):
const HIGH_RARITY_LABELS: readonly string[] = [
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
    private readonly cardsService: CardsService,
  ) {
    this.price = Number(
      this.config.get<string>('BOOSTER_PACK_PRICE_USD') ?? '4.99',
    );
  }

  // ── Endpoints públicos ──────────────────────────────────────────────────────

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
   * Idempotencia: verifica en user_cards (ya no en colecciones_usuario).
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

    // Idempotencia — si ya existe una Order COMPLETED con este paypalOrderId
    if (userId) {
      const existingOrder = await this.prisma.order.findUnique({
        where: { paypalOrderId },
      });
      if (existingOrder?.status === 'COMPLETED') {
        throw new ConflictException('Orden ya capturada anteriormente');
      }
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

  // ── Helpers privados ────────────────────────────────────────────────────────

  /**
   * Selecciona 5 cartas aleatorias garantizando al menos 1 rara.
   * ✅ v2.0: usa Prisma ORM sobre la tabla `cards`.
   */
  private async pickRandomPack(): Promise<{
    cards: BoosterCard[];
    guaranteedId: string;
  }> {
    // Una carta garantizada de rareza alta (tier apex / ascendant / eternal)
    const rareRows = await this.prisma.$queryRaw<Card[]>`
      SELECT *
      FROM cards
      WHERE rarity = ANY(${HIGH_RARITY_TIERS}::text[])
         OR market_price::numeric > ${HIGH_PRICE_THRESHOLD}
      ORDER BY RANDOM()
      LIMIT 1
    `;

    if (rareRows.length === 0) {
      throw new InternalServerErrorException(
        'No hay cartas raras disponibles. Ejecuta el seed de la tabla cards.',
      );
    }
    const rareRow = rareRows[0];

    // Cuatro cartas de relleno (sin repetir la rara)
    const fillRows = await this.prisma.$queryRaw<Card[]>`
      SELECT *
      FROM cards
      WHERE tcg_id <> ${rareRow.tcgId}
      ORDER BY RANDOM()
      LIMIT 4
    `;

    const cards = [...fillRows, rareRow]
      .sort(() => Math.random() - 0.5)
      .map((row) => this.rowToBoosterCard(row));

    return { cards, guaranteedId: rareRow.tcgId };
  }

  /**
   * Persiste las cartas del pack en user_cards.
   * ✅ v2.0: ya NO escribe en colecciones_usuario.
   */
  private async persistPack({
    userId,
    cards,
  }: {
    userId: string | undefined;
    paypalOrderId: string;
    cards: BoosterCard[];
  }): Promise<void> {
    if (!userId) return;

    for (const card of cards) {
      try {
        // Garantiza que la carta exista en `cards` (upsert por tcgId)
        const prismaCard = await this.cardsService.ensureInDb(card.tcgId);

        // Registra en user_cards — orderId queda null (no hay Order individual por booster)
        await this.prisma.userCard.upsert({
          where: { userId_cardId: { userId, cardId: prismaCard.id } },
          update: { quantity: { increment: 1 } },
          create: {
            userId,
            cardId: prismaCard.id,
            obtainedFrom: 'booster',
          },
        });
      } catch (err) {
        this.logger.warn(
          `persistPack: no se pudo guardar carta ${card.tcgId}: ${(err as Error).message}`,
        );
      }
    }
  }

  /** Convierte un row Prisma `Card` al shape público `BoosterCard`. */
  private rowToBoosterCard(row: Card): BoosterCard {
    const mp =
      typeof row.marketPrice === 'object' && 'toNumber' in row.marketPrice
        ? (row.marketPrice as { toNumber(): number }).toNumber()
        : Number(row.marketPrice);

    return {
      tcgId: row.tcgId,
      setId: row.setId,
      nombre: row.name,
      pokemonId: row.pokemonId,
      rareza: row.rarity, // tier interno
      rarityLabel: '', // se puede rellenar desde RARITY_TO_TIER si se necesita
      tipo: row.type,
      imagenSmall: row.imageUrl,
      imagenLarge: row.imageUrl,
      precioMercado: mp,
      stats: {
        hp: row.hp,
        attack: row.attack,
        defense: row.defense,
        speed: row.speed,
      },
      esRara:
        HIGH_RARITY_TIERS.includes(row.rarity) ||
        HIGH_RARITY_LABELS.includes(row.rarity) ||
        mp > HIGH_PRICE_THRESHOLD,
    };
  }
}
