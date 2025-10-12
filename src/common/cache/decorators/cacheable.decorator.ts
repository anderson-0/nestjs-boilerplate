import { SetMetadata } from '@nestjs/common';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../cache.constants';

export interface CacheableOptions {
  ttl?: number;
  keyPrefix?: string;
}

export const Cacheable = (options: CacheableOptions = {}) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_TTL_METADATA, options.ttl)(target, propertyName, descriptor);
    SetMetadata(CACHE_KEY_METADATA, options.keyPrefix)(target, propertyName, descriptor);
    return descriptor;
  };
};