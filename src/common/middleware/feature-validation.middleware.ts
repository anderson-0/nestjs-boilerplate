import {
  Injectable,
  NestMiddleware,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FeatureFlagsService } from '../config/feature-flags.config';
import {
  DatabaseProvider,
  ErrorTrackingProvider,
  AuthProvider,
  CacheProvider,
  DocumentationProvider,
  LoggingProvider,
  PerformanceProvider,
} from '../config/feature-providers.enum';

export interface FeatureRequirement {
  feature: string;
  allowedProviders: string[];
  errorMessage?: string;
}

@Injectable()
export class FeatureValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(FeatureValidationMiddleware.name);

  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate that feature flags are properly configured
      this.validateFeatureConfiguration();

      // Add feature flag context to request for easy access
      (req as any).featureFlags = this.featureFlagsService.getConfig();

      next();
    } catch (error) {
      this.logger.error(`Feature validation failed: ${error.message}`);
      throw new BadRequestException(
        `Feature configuration error: ${error.message}`,
      );
    }
  }

  private validateFeatureConfiguration(): void {
    const config = this.featureFlagsService.getConfig();
    const errors: string[] = [];

    // Validate each feature has a valid provider
    if (!Object.values(DatabaseProvider).includes(config.database)) {
      errors.push(`Invalid database provider: ${config.database}`);
    }

    if (!Object.values(ErrorTrackingProvider).includes(config.errorTracking)) {
      errors.push(`Invalid error tracking provider: ${config.errorTracking}`);
    }

    if (!Object.values(AuthProvider).includes(config.auth)) {
      errors.push(`Invalid auth provider: ${config.auth}`);
    }

    if (!Object.values(CacheProvider).includes(config.cache)) {
      errors.push(`Invalid cache provider: ${config.cache}`);
    }

    if (!Object.values(DocumentationProvider).includes(config.documentation)) {
      errors.push(`Invalid documentation provider: ${config.documentation}`);
    }

    if (!Object.values(LoggingProvider).includes(config.logging)) {
      errors.push(`Invalid logging provider: ${config.logging}`);
    }

    if (!Object.values(PerformanceProvider).includes(config.performance)) {
      errors.push(`Invalid performance provider: ${config.performance}`);
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
  }

  /**
   * Create a middleware that validates specific feature requirements for a route
   */
  static forFeatures(requirements: FeatureRequirement[]): any {
    return (req: Request, res: Response, next: NextFunction) => {
      const featureFlags = (req as any).featureFlags;

      if (!featureFlags) {
        throw new BadRequestException(
          'Feature flags not available in request context',
        );
      }

      const errors: string[] = [];

      for (const requirement of requirements) {
        const currentProvider = featureFlags[requirement.feature];

        if (!requirement.allowedProviders.includes(currentProvider)) {
          const errorMsg =
            requirement.errorMessage ||
            `Feature "${requirement.feature}" must be one of: ${requirement.allowedProviders.join(', ')}. Current: ${currentProvider}`;
          errors.push(errorMsg);
        }
      }

      if (errors.length > 0) {
        throw new BadRequestException(
          `Feature requirements not met: ${errors.join('; ')}`,
        );
      }

      next();
    };
  }

  /**
   * Middleware to require specific database provider
   */
  static requireDatabase(
    providers: DatabaseProvider | DatabaseProvider[],
  ): any {
    const allowedProviders = Array.isArray(providers) ? providers : [providers];
    return FeatureValidationMiddleware.forFeatures([
      {
        feature: 'database',
        allowedProviders,
        errorMessage: `This endpoint requires database provider to be one of: ${allowedProviders.join(', ')}`,
      },
    ]);
  }

  /**
   * Middleware to require authentication to be enabled
   */
  static requireAuth(providers?: AuthProvider | AuthProvider[]): any {
    const allowedProviders = providers
      ? Array.isArray(providers)
        ? providers
        : [providers]
      : [
          AuthProvider.COMPOSITE,
          AuthProvider.BEARER_ONLY,
          AuthProvider.API_KEY_ONLY,
        ];

    return FeatureValidationMiddleware.forFeatures([
      {
        feature: 'auth',
        allowedProviders,
        errorMessage: `This endpoint requires authentication to be enabled`,
      },
    ]);
  }

  /**
   * Middleware to require caching to be enabled
   */
  static requireCache(providers?: CacheProvider | CacheProvider[]): any {
    const allowedProviders = providers
      ? Array.isArray(providers)
        ? providers
        : [providers]
      : [CacheProvider.REDIS, CacheProvider.MEMORY];

    return FeatureValidationMiddleware.forFeatures([
      {
        feature: 'cache',
        allowedProviders,
        errorMessage: `This endpoint requires caching to be enabled`,
      },
    ]);
  }

  /**
   * Middleware to require error tracking to be enabled
   */
  static requireErrorTracking(
    providers?: ErrorTrackingProvider | ErrorTrackingProvider[],
  ): any {
    const allowedProviders = providers
      ? Array.isArray(providers)
        ? providers
        : [providers]
      : [
          ErrorTrackingProvider.BUGSNAG,
          ErrorTrackingProvider.SENTRY,
          ErrorTrackingProvider.POSTHOG,
        ];

    return FeatureValidationMiddleware.forFeatures([
      {
        feature: 'errorTracking',
        allowedProviders,
        errorMessage: `This endpoint requires error tracking to be enabled`,
      },
    ]);
  }

  /**
   * Middleware to require performance features to be enabled
   */
  static requirePerformance(
    providers?: PerformanceProvider | PerformanceProvider[],
  ): any {
    const allowedProviders = providers
      ? Array.isArray(providers)
        ? providers
        : [providers]
      : [PerformanceProvider.BASIC, PerformanceProvider.FULL];

    return FeatureValidationMiddleware.forFeatures([
      {
        feature: 'performance',
        allowedProviders,
        errorMessage: `This endpoint requires performance features to be enabled`,
      },
    ]);
  }
}
