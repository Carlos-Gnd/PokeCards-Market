import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
declare class RegisterDto {
    email: string;
    password: string;
    username: string;
}
export declare class AuthController {
    private readonly config;
    private readonly users;
    private readonly logger;
    constructor(config: ConfigService, users: UsersService);
    register(dto: RegisterDto): Promise<{
        success: boolean;
        userId: string;
        email: string;
        message: string;
    }>;
}
export {};
