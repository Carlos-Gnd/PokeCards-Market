import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { CurrentUser, type SessionUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

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

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw new BadRequestException('Ya existe una cuenta con ese correo');
    }

    const user = await this.users.createWithPassword({
      email,
      username: dto.username.trim(),
      passwordHash: await this.auth.hashPassword(dto.password),
    });
    return this.session(user);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email.trim().toLowerCase());
    // Mismo mensaje si el correo no existe o la contraseña falla (no revela cuentas)
    const ok =
      !!user?.passwordHash &&
      (await this.auth.verifyPassword(dto.password, user.passwordHash));
    if (!user || !ok) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    return this.session(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: SessionUser) {
    return { user };
  }

  private session(user: { id: string; email: string; username: string }) {
    return {
      token: this.auth.signToken(user),
      user: { id: user.id, email: user.email, username: user.username },
    };
  }
}
