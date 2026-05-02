import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PokeapiService } from './cards/pokeapi.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  // Pre-calienta cache de PokéAPI en background (no bloquea startup)
  app.get(PokeapiService).warmup();

  const corsOrigin = config.get<string>('CORS_ORIGIN') || 'http://localhost:5173';
  app.enableCors({
    origin: corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = Number(config.get('PORT')) || 3000;
  await app.listen(port);
  Logger.log(`ARCADIUM API listening on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
