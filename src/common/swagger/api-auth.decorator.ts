import { applyDecorators } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';

export function ApiAuth() {
  return applyDecorators(
    ApiSecurity('bearer-auth'),
    ApiSecurity('api-key'),
  );
}