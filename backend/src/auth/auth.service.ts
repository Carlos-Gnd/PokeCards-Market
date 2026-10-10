import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export interface AuthUserPayload {
  sub: string;
  email: string;
}

const BCRYPT_ROUNDS = 10;
const TOKEN_TTL = '7d';

/**
 * Auth propia (reemplaza a Supabase Auth): contraseñas con bcrypt y sesión con
 * un JWT HS256 firmado por este backend. Los hashes $2a$ que venían de Supabase
 * (auth.users.encrypted_password) se verifican igual, así que los usuarios
 * migrados conservan su contraseña.
 */
@Injectable()
export class AuthService {
  private readonly secret: string;

  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET no está configurado');
    }
    this.secret = secret;
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  signToken(user: { id: string; email: string }): string {
    return jwt.sign({ sub: user.id, email: user.email }, this.secret, {
      algorithm: 'HS256',
      expiresIn: TOKEN_TTL,
    });
  }

  verifyToken(token: string): AuthUserPayload {
    try {
      return jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
      }) as AuthUserPayload;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
