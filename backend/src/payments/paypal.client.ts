import { Injectable, Logger, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PaypalClient implements OnModuleInit {
  private readonly logger = new Logger(PaypalClient.name);
  private client!: paypal.core.PayPalHttpClient;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const clientId = this.config.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.config.get<string>('PAYPAL_CLIENT_SECRET');
    const env = (this.config.get<string>('PAYPAL_ENV') || 'sandbox').toLowerCase();

    if (!clientId || !clientSecret) {
      this.logger.error('Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET en .env');
      throw new InternalServerErrorException('PayPal credentials missing');
    }

    const environment =
      env === 'live'
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret);

    this.client = new paypal.core.PayPalHttpClient(environment);
    this.logger.log(`PayPal client iniciado (${env})`);
  }

  get http(): paypal.core.PayPalHttpClient {
    return this.client;
  }
}
