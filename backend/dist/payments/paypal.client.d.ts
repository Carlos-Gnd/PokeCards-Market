import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';
interface PayPalLink {
    rel: string;
    href: string;
    method?: string;
}
export interface PayPalOrderCreated {
    id: string;
    approveUrl: string | undefined;
    links: PayPalLink[];
}
export interface PayPalOrderCaptured {
    status: string;
    capturedAmount: number | null;
}
export declare class PaypalClient implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private client;
    private ready;
    constructor(config: ConfigService);
    onModuleInit(): void;
    isReady(): boolean;
    get http(): paypal.core.PayPalHttpClient;
    createOrder(amountUsd: number, referenceId: string, description: string): Promise<PayPalOrderCreated>;
    captureOrder(paypalOrderId: string): Promise<PayPalOrderCaptured>;
}
export {};
