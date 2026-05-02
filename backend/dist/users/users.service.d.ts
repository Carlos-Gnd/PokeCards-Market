import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    upsertFromAuth(input: {
        id: string;
        email: string;
    }): Promise<{
        id: string;
        email: string;
        username: string;
        avatarUrl: string | null;
        language: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createProfile(input: {
        id: string;
        email: string;
        username: string;
    }): Promise<{
        id: string;
        email: string;
        username: string;
        avatarUrl: string | null;
        language: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private uniqueUsername;
}
