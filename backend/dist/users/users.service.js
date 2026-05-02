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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upsertFromAuth(input) {
        const fallbackUsername = input.email
            ? input.email.split('@')[0]
            : `arcanaut_${input.id.slice(0, 6)}`;
        return this.prisma.user.upsert({
            where: { id: input.id },
            update: {},
            create: {
                id: input.id,
                email: input.email ?? `${input.id}@anon.local`,
                username: await this.uniqueUsername(fallbackUsername),
                language: 'es',
            },
        });
    }
    async createProfile(input) {
        return this.prisma.user.upsert({
            where: { id: input.id },
            update: { username: input.username },
            create: {
                id: input.id,
                email: input.email,
                username: await this.uniqueUsername(input.username),
                language: 'es',
            },
        });
    }
    async uniqueUsername(base) {
        let candidate = base;
        let i = 0;
        while (await this.prisma.user.findUnique({ where: { username: candidate } })) {
            i += 1;
            candidate = `${base}_${i}`;
            if (i > 50) {
                candidate = `${base}_${Date.now().toString(36)}`;
                break;
            }
        }
        return candidate;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map