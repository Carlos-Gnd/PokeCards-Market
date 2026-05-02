import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromAuth(input: { id: string; email: string }) {
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

  async createProfile(input: { id: string; email: string; username: string }) {
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

  private async uniqueUsername(base: string): Promise<string> {
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
}
