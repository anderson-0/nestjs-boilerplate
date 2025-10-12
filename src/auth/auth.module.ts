import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CompositeAuthGuard } from './guards/composite-auth.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { BearerTokenGuard } from './guards/bearer-token.guard';

@Global()
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: CompositeAuthGuard,
    },
    CompositeAuthGuard,
    ApiKeyGuard,
    BearerTokenGuard,
  ],
  exports: [CompositeAuthGuard, ApiKeyGuard, BearerTokenGuard],
})
export class AuthModule {}