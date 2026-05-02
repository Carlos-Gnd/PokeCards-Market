import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

export interface AuthUserPayload {
  sub: string;
  email: string;
  role?: string;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no provisto');
    }
    const token = auth.slice(7);
    const secret = this.config.get<string>('SUPABASE_JWT_SECRET');

    try {
      let payload: AuthUserPayload;
      if (secret) {
        payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as AuthUserPayload;
      } else {
        // Fallback: decodificar sin verificar (solo dev cuando no se ha provisto el secreto)
        const decoded = jwt.decode(token) as AuthUserPayload | null;
        if (!decoded?.sub) throw new Error('JWT inválido');
        payload = decoded;
        this.logger.warn('SUPABASE_JWT_SECRET no configurado: validando solo decode');
      }

      // Lazy upsert del perfil
      const profile = await this.users.upsertFromAuth({
        id: payload.sub,
        email: payload.email,
      });

      (req as any).user = profile;
      return true;
    } catch (err) {
      this.logger.warn(`JWT inválido: ${(err as Error).message}`);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}

