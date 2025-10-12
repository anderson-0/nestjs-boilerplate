import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { RepositoryModule } from './common/repositories/repository.module';
import { TodosModule } from './todos/todos.module';
import { SwaggerModule } from './common/swagger/swagger.module';
import { ErrorTrackingModule } from './common/error-tracking/error-tracking.module';
import { CacheModule } from './common/cache/cache.module';
import { FeatureFlagsService } from './common/config/feature-flags.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    RepositoryModule.forRoot(),
    CacheModule,
    AuthModule,
    ErrorTrackingModule,
    SwaggerModule,
    TodosModule,
  ],
  providers: [FeatureFlagsService],
})
export class AppModule {}