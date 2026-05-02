import { Global, Module } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { AuthController } from './auth.controller';

@Global()
@Module({
  controllers: [AuthController],
  providers: [SupabaseAuthGuard],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
