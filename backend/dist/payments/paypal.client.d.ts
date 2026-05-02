import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';
export declare class PaypalClient implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private client;
    constructor(config: ConfigService);
    onModuleInit(): void;
    get http(): paypal.core.PayPalHttpClient;
}
