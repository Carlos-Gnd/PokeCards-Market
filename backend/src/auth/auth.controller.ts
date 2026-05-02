import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { UsersService } from '../users/users.service';

class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(3)
  username!: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const url = this.config.get<string>('SUPABASE_URL');
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !serviceKey) {
      throw new BadRequestException('Servidor de auth no configurado');
    }

    // Llama al admin API de GoTrue para crear usuario con email auto-confirmado
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
      const body = (await res.json().catch(() => ({}))) as any;
      const msg = body?.msg || body?.message || body?.error_description || 'No se pudo crear la cuenta';
      this.logger.warn(`Registro falló para ${dto.email}: ${msg}`);
      throw new BadRequestException(msg);
    }

    const user = (await res.json()) as { id: string; email: string };

    // Crea perfil en public.users con el username deseado
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
}
