import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ApiKeyGuard } from './api-key.guard';
import { BearerTokenGuard } from './bearer-token.guard';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CompositeAuthGuard implements CanActivate {
  private apiKeyGuard: ApiKeyGuard;
  private bearerTokenGuard: BearerTokenGuard;

  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {
    this.apiKeyGuard = new ApiKeyGuard(configService, reflector);
    this.bearerTokenGuard = new BearerTokenGuard(configService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const hasApiKey = request.headers['x-api-key'];
    const hasBearerToken = request.headers['authorization']?.startsWith('Bearer ');

    try {
      if (hasApiKey) {
        return this.apiKeyGuard.canActivate(context);
      }

      if (hasBearerToken) {
        return this.bearerTokenGuard.canActivate(context);
      }

      throw new UnauthorizedException('Authentication required');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}