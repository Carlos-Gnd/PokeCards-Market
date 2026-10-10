import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import type { SessionUser } from './current-user.decorator';

/** Extensión tipada de Express Request que incluye el usuario autenticado. */
type AuthenticatedRequest = Request & { user?: SessionUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no provisto');
    }

    const payload = this.auth.verifyToken(header.slice(7));
    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    req.user = { id: user.id, email: user.email, username: user.username };
    return true;
  }
}
