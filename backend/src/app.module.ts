import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CardsModule } from './cards/cards.module';
import { PaymentsModule } from './payments/payments.module';
import { CollectionModule } from './collection/collection.module';
import { UsersModule } from './users/users.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CardsModule,
    PaymentsModule,
    CollectionModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
