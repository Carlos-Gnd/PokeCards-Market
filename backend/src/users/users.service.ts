import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createWithPassword(input: {
    email: string;
    username: string;
    passwordHash: string;
  }) {
    return this.prisma.user.create({
      data: {
        id: randomUUID(),
        email: input.email,
        username: await this.uniqueUsername(input.username),
        passwordHash: input.passwordHash,
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
