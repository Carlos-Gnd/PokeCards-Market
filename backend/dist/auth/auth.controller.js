"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const class_validator_1 = require("class-validator");
const users_service_1 = require("../users/users.service");
class RegisterDto {
    email;
    password;
    username;
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], RegisterDto.prototype, "username", void 0);
let AuthController = AuthController_1 = class AuthController {
    config;
    users;
    logger = new common_1.Logger(AuthController_1.name);
    constructor(config, users) {
        this.config = config;
        this.users = users;
    }
    async register(dto) {
        const url = this.config.get('SUPABASE_URL');
        const serviceKey = this.config.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!url || !serviceKey) {
            throw new common_1.BadRequestException('Servidor de auth no configurado');
        }
        const adminUrl = `${url.replace(/\/$/, '')}/auth/v1/admin/users`;
        const res = await fetch(adminUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
                email: dto.email,
                password: dto.password,
                email_confirm: true,
                user_metadata: { username: dto.username },
            }),
        });
        if (!res.ok) {
            const body = (await res.json().catch(() => ({})));
            const msg = body.msg ??
                body.message ??
                body.error_description ??
                'No se pudo crear la cuenta';
            this.logger.warn(`Registro falló para ${dto.email}: ${msg}`);
            throw new common_1.BadRequestException(msg);
        }
        const user = (await res.json());
        await this.users.createProfile({
            id: user.id,
            email: user.email,
            username: dto.username,
        });
        return {
            success: true,
            userId: user.id,
            email: user.email,
            message: 'Cuenta creada correctamente.',
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [config_1.ConfigService,
        users_service_1.UsersService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map