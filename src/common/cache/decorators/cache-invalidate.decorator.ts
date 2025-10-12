import { SetMetadata } from '@nestjs/common';
import { CACHE_INVALIDATE_METADATA } from '../cache.constants';

export interface CacheInvalidateOptions {
  pattern?: string;
  tags?: string[];
}

export const CacheInvalidate = (options: CacheInvalidateOptions = {}) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_INVALIDATE_METADATA, options)(target, propertyName, descriptor);
    return descriptor;
  };
};