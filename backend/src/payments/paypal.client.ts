import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';

/** Shape mínimo de un link de respuesta de la API de PayPal. */
interface PayPalLink {
  rel: string;
  href: string;
  method?: string;
}

/** Resultado de crear una orden PayPal. */
export interface PayPalOrderCreated {
  id: string;
  approveUrl: string | undefined;
  links: PayPalLink[];
}

/** Resultado de capturar una orden PayPal. */
export interface PayPalOrderCaptured {
  status: string;
  capturedAmount: number | null;
}

@Injectable()
export class PaypalClient implements OnModuleInit {
  private readonly logger = new Logger(PaypalClient.name);
  private client!: paypal.core.PayPalHttpClient;
  private ready = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const clientId = this.config.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.config.get<string>('PAYPAL_CLIENT_SECRET');
    const env = (
      this.config.get<string>('PAYPAL_ENV') ?? 'sandbox'
    ).toLowerCase();

    if (!clientId || !clientSecret) {
      this.logger.warn(
        'PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET no configurados — PayPal en modo degradado',
      );
      return;
    }

    const environment =
      env === 'live'
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret);

    this.client = new paypal.core.PayPalHttpClient(environment);
    this.ready = true;
    this.logger.log(`PayPal client iniciado (${env})`);
  }

  /** True si las credenciales están configuradas y el cliente está listo. */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Acceso al cliente HTTP nativo para payments existentes (PaymentsService).
   * Lanza si PayPal no está configurado.
   */
  get http(): paypal.core.PayPalHttpClient {
    if (!this.ready) {
      throw new InternalServerErrorException('PayPal no está configurado');
    }
    return this.client;
  }

  /**
   * Crea una orden de PayPal.
   * Helper compartido entre PaymentsService y BoosterService.
   */
  async createOrder(
    amountUsd: number,
    referenceId: string,
    description: string,
  ): Promise<PayPalOrderCreated> {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: referenceId,
          description,
          amount: { currency_code: 'USD', value: amountUsd.toFixed(2) },
        },
      ],
      application_context: {
        brand_name: 'ARCADIUM',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
      },
    });

    const response = await this.http.execute(request);
    const result = response.result as {
      id: string;
      links?: PayPalLink[];
    };

    const links: PayPalLink[] = result.links ?? [];
    const approveUrl = links.find((l) => l.rel === 'approve')?.href;

    return { id: result.id, approveUrl, links };
  }

  /**
   * Captura una orden de PayPal ya aprobada por el comprador.
   * Devuelve el status y el monto capturado para validación downstream.
   */
  async captureOrder(paypalOrderId: string): Promise<PayPalOrderCaptured> {
    const captureReq = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    // El SDK tipea requestBody como any en su definición — cast necesario
    (captureReq as { requestBody: (b: object) => void }).requestBody({});

    const result = await this.http.execute(captureReq);
    const captureResult = result.result as {
      status?: string;
      purchase_units?: Array<{
        payments?: {
          captures?: Array<{
            amount?: { value?: string };
          }>;
        };
      }>;
    };

    const capturedAmount = Number(
      captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.amount
        ?.value ?? null,
    );

    return {
      status: captureResult.status ?? 'UNKNOWN',
      capturedAmount: Number.isFinite(capturedAmount) ? capturedAmount : null,
    };
  }
}
