import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
export interface AuthUserPayload {
    sub: string;
    email: string;
    role?: string;
}
export declare class SupabaseAuthGuard implements CanActivate {
    private readonly config;
    private readonly users;
    private readonly logger;
    constructor(config: ConfigService, users: UsersService);
    canActivate(ctx: ExecutionContext): Promise<boolean>;
}
