import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';

const SECRET = 'test-secret-de-al-menos-32-caracteres!!';

function buildService(secret: string | undefined) {
  const config = { get: () => secret } as unknown as ConfigService;
  return new AuthService(config);
}

describe('AuthService', () => {
  it('hashea y verifica la contraseña correcta', async () => {
    const svc = buildService(SECRET);
    const hash = await svc.hashPassword('pikachu123');
    expect(hash).not.toContain('pikachu123');
    await expect(svc.verifyPassword('pikachu123', hash)).resolves.toBe(true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const svc = buildService(SECRET);
    const hash = await svc.hashPassword('pikachu123');
    await expect(svc.verifyPassword('charmander', hash)).resolves.toBe(false);
  });

  it('acepta hashes $2a$ migrados desde Supabase Auth', async () => {
    const svc = buildService(SECRET);
    const supabaseHash = bcrypt.hashSync('migrado123', 10).replace(/^\$2b\$/, '$2a$');
    await expect(svc.verifyPassword('migrado123', supabaseHash)).resolves.toBe(true);
  });

  it('firma un token que luego verifica con el mismo sub y email', () => {
    const svc = buildService(SECRET);
    const token = svc.signToken({ id: 'u-1', email: 'ash@kanto.dev' });
    expect(svc.verifyToken(token)).toMatchObject({ sub: 'u-1', email: 'ash@kanto.dev' });
  });

  it('rechaza un token firmado con otro secreto', () => {
    const svc = buildService(SECRET);
    const forged = jwt.sign({ sub: 'u-1', email: 'x@y.z' }, 'otro-secreto');
    expect(() => svc.verifyToken(forged)).toThrow(UnauthorizedException);
  });

  it('rechaza un token expirado', () => {
    const svc = buildService(SECRET);
    const expired = jwt.sign({ sub: 'u-1', email: 'x@y.z' }, SECRET, { expiresIn: -10 });
    expect(() => svc.verifyToken(expired)).toThrow(UnauthorizedException);
  });

  it('falla al arrancar si falta JWT_SECRET', () => {
    expect(() => buildService(undefined)).toThrow(/JWT_SECRET/);
  });
});
