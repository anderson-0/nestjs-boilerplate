import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { FeatureFlagsService } from '../config/feature-flags.config';
import { CacheProvider } from '../config/feature-providers.enum';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      useFactory: async (configService: ConfigService, featureFlagsService: FeatureFlagsService) => {
        const cacheProvider = featureFlagsService.getCacheProvider();

        switch (cacheProvider) {
          case CacheProvider.REDIS:
            // For Redis caching, we'll use a simple memory cache as fallback
            // In production, you might want to use ioredis directly or another Redis adapter
            return {
              ttl: 60000, // 60 seconds in milliseconds
              max: 1000, // Maximum number of items in cache
            };

          case CacheProvider.MEMORY:
            return {
              ttl: 60000, // 60 seconds in milliseconds
              max: 1000, // Maximum number of items in cache
            };

          case CacheProvider.NONE:
          default:
            // Disable caching
            return {
              ttl: 0,
              max: 0,
            };
        }
      },
      inject: [ConfigService, FeatureFlagsService],
    }),
  ],
  providers: [CacheInterceptor],
  exports: [NestCacheModule, CacheInterceptor],
})
export class CacheModule {}