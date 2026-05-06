// ── backend/src/booster/booster.service.ts — v2.1 ────────────────────────────
// Bug fix: $queryRaw devolvía columnas en snake_case (tcg_id, image_url)
// pero el tipo Card espera camelCase — todos los campos eran undefined,
// haciendo que los 5 keys del pack fueran undefined y React colapsara la
// cuadrícula a 1 elemento. Se reemplaza $queryRaw por CardsService.listAll()
// que ya pasa por rowToPokeCard() y devuelve campos en camelCase correctos.
// Además: los packs ahora solo incluyen cartas del set configurado (BOOSTER_SET_ID).
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
import type { PokeCard } from '../cards/pokeapi.service';

// Tiers de rareza alta (en formato de PokeCard.rarity — camelCase, ya mapeado)
const HIGH_RARITY_TIERS = new Set(['apex', 'ascendant', 'eternal']);
const HIGH_PRICE_THRESHOLD = 5.0;

// Set al que pertenece este sobre: "Prismatic Evolutions" (sv8pt5).
// Todos los packs usan únicamente cartas de este set.
const BOOSTER_SET_ID = 'sv8pt5';

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
   * Selecciona 5 cartas del set configurado (BOOSTER_SET_ID), garantizando
   * al menos 1 de rareza alta.
   *
   * Bug fix v2.1: se usa CardsService.listAll() (→ PokeCard, camelCase) en vez
   * de $queryRaw (→ snake_case). Con $queryRaw los campos tcgId, imageUrl, etc.
   * eran undefined porque la DB los devuelve como tcg_id, image_url. Eso hacía
   * que los 5 keys fueran undefined y React colapsara el grid a 1 carta.
   */
  private async pickRandomPack(): Promise<{
    cards: BoosterCard[];
    guaranteedId: string;
  }> {
    const catalog = await this.cardsService.listAll(); // PokeCard[] — camelCase

    // Filtrar al set del sobre; si no hay suficientes, usar catálogo completo
    const setCards = catalog.filter((c) => c.setId === BOOSTER_SET_ID);
    const pool = setCards.length >= 5 ? setCards : catalog;

    if (pool.length === 0) {
      throw new InternalServerErrorException(
        'No hay cartas disponibles. Ejecuta el seed de la tabla cards.',
      );
    }

    // Pool de cartas raras para la carta garantizada
    const rarePool = pool.filter(
      (c) =>
        HIGH_RARITY_TIERS.has(c.rarity) || c.marketPrice > HIGH_PRICE_THRESHOLD,
    );

    // Si no hay raras en el pool, usar la de mayor precio como garantizada
    const guaranteedCard =
      rarePool.length > 0
        ? rarePool[Math.floor(Math.random() * rarePool.length)]
        : [...pool].sort((a, b) => b.marketPrice - a.marketPrice)[0];

    // Cartas de relleno evitando repetir la garantizada si hay suficientes
    const fillSource = pool.filter((c) => c.tcgId !== guaranteedCard.tcgId);
    const shuffled = [...fillSource].sort(() => Math.random() - 0.5);
    const fillCards = shuffled.slice(0, 4);

    // Si el pool es muy pequeño, permite duplicados para completar 5 cartas
    while (fillCards.length < 4) {
      fillCards.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    const cards = [guaranteedCard, ...fillCards]
      .sort(() => Math.random() - 0.5)
      .map((c) => this.pokeCardToBoosterCard(c));

    return { cards, guaranteedId: guaranteedCard.tcgId };
  }

  /**
   * Persiste las cartas del pack en user_cards vía ensureInDb.
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
        const prismaCard = await this.cardsService.ensureInDb(card.tcgId);

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

  /** Convierte PokeCard (catálogo, camelCase) al shape de respuesta BoosterCard. */
  private pokeCardToBoosterCard(card: PokeCard): BoosterCard {
    return {
      tcgId: card.tcgId,
      setId: card.setId,
      nombre: card.name,
      pokemonId: card.pokemonId,
      rareza: card.rarity,
      rarityLabel: card.rarityLabel,
      tipo: card.type,
      imagenSmall: card.imageUrl,
      imagenLarge: card.imageUrl,
      precioMercado: card.marketPrice,
      stats: card.stats,
      esRara:
        HIGH_RARITY_TIERS.has(card.rarity) ||
        card.marketPrice > HIGH_PRICE_THRESHOLD,
    };
  }
}
