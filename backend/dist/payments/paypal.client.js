"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaypalClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaypalClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const paypal = __importStar(require("@paypal/checkout-server-sdk"));
let PaypalClient = PaypalClient_1 = class PaypalClient {
    config;
    logger = new common_1.Logger(PaypalClient_1.name);
    client;
    ready = false;
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        const clientId = this.config.get('PAYPAL_CLIENT_ID');
        const clientSecret = this.config.get('PAYPAL_CLIENT_SECRET');
        const env = (this.config.get('PAYPAL_ENV') ?? 'sandbox').toLowerCase();
        if (!clientId || !clientSecret) {
            this.logger.warn('PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET no configurados — PayPal en modo degradado');
            return;
        }
        const environment = env === 'live'
            ? new paypal.core.LiveEnvironment(clientId, clientSecret)
            : new paypal.core.SandboxEnvironment(clientId, clientSecret);
        this.client = new paypal.core.PayPalHttpClient(environment);
        this.ready = true;
        this.logger.log(`PayPal client iniciado (${env})`);
    }
    isReady() {
        return this.ready;
    }
    get http() {
        if (!this.ready) {
            throw new common_1.InternalServerErrorException('PayPal no está configurado');
        }
        return this.client;
    }
    async createOrder(amountUsd, referenceId, description) {
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
        const result = response.result;
        const links = result.links ?? [];
        const approveUrl = links.find((l) => l.rel === 'approve')?.href;
        return { id: result.id, approveUrl, links };
    }
    async captureOrder(paypalOrderId) {
        const captureReq = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
        captureReq.requestBody({});
        const result = await this.http.execute(captureReq);
        const captureResult = result.result;
        const capturedAmount = Number(captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.amount
            ?.value ?? null);
        return {
            status: captureResult.status ?? 'UNKNOWN',
            capturedAmount: Number.isFinite(capturedAmount) ? capturedAmount : null,
        };
    }
};
exports.PaypalClient = PaypalClient;
exports.PaypalClient = PaypalClient = PaypalClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaypalClient);
//# sourceMappingURL=paypal.client.js.map