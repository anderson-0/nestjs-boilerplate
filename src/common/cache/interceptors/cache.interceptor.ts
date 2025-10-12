/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
  CACHE_INVALIDATE_METADATA,
  CacheTTL,
} from '../cache.constants';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    const invalidateOptions = this.reflector.get(
      CACHE_INVALIDATE_METADATA,
      handler,
    );

    if (invalidateOptions) {
      if (invalidateOptions.pattern) {
        // Note: Pattern-based cache invalidation is not directly supported in cache-manager v7
        // This is a simplified implementation - in production you might want to use a different approach
        // such as maintaining a registry of cache keys or using Redis directly for pattern matching
        console.warn(
          'Pattern-based cache invalidation is not supported in cache-manager v7',
        );
      }

      // For specific key invalidation, we can still use del()
      if (invalidateOptions.keys) {
        for (const key of invalidateOptions.keys) {
          await this.cacheManager.del(key);
        }
      }

      return next.handle();
    }

    const keyPrefix = this.reflector.get(CACHE_KEY_METADATA, handler);
    const ttl =
      this.reflector.get(CACHE_TTL_METADATA, handler) || CacheTTL.ONE_MINUTE;

    if (!keyPrefix) {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(keyPrefix, request);
    const cachedResponse = await this.cacheManager.get(cacheKey);

    if (cachedResponse) {
      return of(cachedResponse);
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheManager.set(cacheKey, response, ttl);
      }),
    );
  }

  private generateCacheKey(prefix: string, request: any): string {
    const url = request.url;
    const method = request.method;
    const params = JSON.stringify(request.params || {});
    const query = JSON.stringify(request.query || {});

    return `${prefix}:${method}:${url}:${params}:${query}`;
  }
}
