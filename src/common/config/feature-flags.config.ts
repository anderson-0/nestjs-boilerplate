import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DatabaseProvider,
  ErrorTrackingProvider,
  AuthProvider,
  CacheProvider,
  DocumentationProvider,
  LoggingProvider,
  PerformanceProvider,
  VALID_PROVIDERS,
  PROVIDER_DESCRIPTIONS,
} from './feature-providers.enum';

export interface FeatureFlagsConfig {
  // Core Feature Providers (ONE option per feature)
  database: DatabaseProvider;
  errorTracking: ErrorTrackingProvider;
  auth: AuthProvider;
  cache: CacheProvider;
  documentation: DocumentationProvider;
  logging: LoggingProvider;
  performance: PerformanceProvider;
}

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private readonly config: FeatureFlagsConfig;

  constructor(private configService: ConfigService) {
    this.config = this.loadAndValidateConfig();
  }

  private loadAndValidateConfig(): FeatureFlagsConfig {
    const config: FeatureFlagsConfig = {
      database: this.getValidatedProvider(
        'DATABASE_PROVIDER',
        VALID_PROVIDERS.DATABASE,
        DatabaseProvider.PRISMA_POSTGRESQL,
      ),
      errorTracking: this.getValidatedProvider(
        'ERROR_TRACKING_PROVIDER',
        VALID_PROVIDERS.ERROR_TRACKING,
        ErrorTrackingProvider.NONE,
      ),
      auth: this.getValidatedProvider(
        'AUTH_PROVIDER',
        VALID_PROVIDERS.AUTH,
        AuthProvider.COMPOSITE,
      ),
      cache: this.getValidatedProvider(
        'CACHE_PROVIDER',
        VALID_PROVIDERS.CACHE,
        CacheProvider.REDIS,
      ),
      documentation: this.getValidatedProvider(
        'DOCUMENTATION_PROVIDER',
        VALID_PROVIDERS.DOCUMENTATION,
        DocumentationProvider.SWAGGER,
      ),
      logging: this.getValidatedProvider(
        'LOGGING_PROVIDER',
        VALID_PROVIDERS.LOGGING,
        LoggingProvider.BASIC,
      ),
      performance: this.getValidatedProvider(
        'PERFORMANCE_PROVIDER',
        VALID_PROVIDERS.PERFORMANCE,
        PerformanceProvider.BASIC,
      ),
    };

    this.validateConfiguration(config);
    return config;
  }

  private getValidatedProvider<T extends string>(
    envVar: string,
    validOptions: readonly T[],
    defaultValue: T,
  ): T {
    const value = this.configService.get<T>(envVar, defaultValue);

    if (!validOptions.includes(value)) {
      const error = `Invalid ${envVar}: "${value}". Valid options: ${validOptions.join(', ')}`;
      this.logger.error(error);
      throw new Error(error);
    }

    return value;
  }

  private validateConfiguration(config: FeatureFlagsConfig): void {
    const errors: string[] = [];

    // Validate each feature has exactly one option selected
    Object.entries(config).forEach(([feature, provider]) => {
      if (!provider) {
        errors.push(`Feature "${feature}" has no provider selected`);
      }
    });

    // Additional validation rules can be added here
    if (config.database === DatabaseProvider.MONGOOSE_MONGODB) {
      const mongoUrl = this.configService.get('MONGODB_URL');
      if (!mongoUrl) {
        errors.push('MONGODB_URL is required when using mongoose-mongodb database provider');
      }
    }

    if ([DatabaseProvider.PRISMA_POSTGRESQL, DatabaseProvider.DRIZZLE_POSTGRESQL].includes(config.database)) {
      const dbUrl = this.configService.get('DATABASE_URL');
      if (!dbUrl) {
        errors.push('DATABASE_URL is required when using PostgreSQL database providers');
      }
    }

    if (config.cache === CacheProvider.REDIS) {
      const redisHost = this.configService.get('REDIS_HOST');
      if (!redisHost) {
        errors.push('REDIS_HOST is required when using redis cache provider');
      }
    }

    if (errors.length > 0) {
      const errorMessage = `Feature flag validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    this.logger.log('✅ Feature flag validation passed');
  }

  // Configuration getters
  getConfig(): FeatureFlagsConfig {
    return { ...this.config };
  }

  getDatabaseProvider(): DatabaseProvider {
    return this.config.database;
  }

  getErrorTrackingProvider(): ErrorTrackingProvider {
    return this.config.errorTracking;
  }

  getAuthProvider(): AuthProvider {
    return this.config.auth;
  }

  getCacheProvider(): CacheProvider {
    return this.config.cache;
  }

  getDocumentationProvider(): DocumentationProvider {
    return this.config.documentation;
  }

  getLoggingProvider(): LoggingProvider {
    return this.config.logging;
  }

  getPerformanceProvider(): PerformanceProvider {
    return this.config.performance;
  }

  // Feature state checkers
  isErrorTrackingEnabled(): boolean {
    return this.config.errorTracking !== ErrorTrackingProvider.NONE;
  }

  isCacheEnabled(): boolean {
    return this.config.cache !== CacheProvider.NONE;
  }

  isDocumentationEnabled(): boolean {
    return this.config.documentation !== DocumentationProvider.NONE;
  }

  isAuthEnabled(): boolean {
    return this.config.auth !== AuthProvider.NONE;
  }

  isLoggingEnabled(): boolean {
    return this.config.logging !== LoggingProvider.NONE;
  }

  isPerformanceEnabled(): boolean {
    return this.config.performance !== PerformanceProvider.NONE;
  }

  // Performance feature checkers
  isThrottlingEnabled(): boolean {
    return [PerformanceProvider.BASIC, PerformanceProvider.FULL].includes(this.config.performance);
  }

  isCompressionEnabled(): boolean {
    return [PerformanceProvider.BASIC, PerformanceProvider.FULL].includes(this.config.performance);
  }

  isBenchmarkingEnabled(): boolean {
    return this.config.performance === PerformanceProvider.FULL;
  }

  // Auth feature checkers
  isBearerAuthEnabled(): boolean {
    return [AuthProvider.COMPOSITE, AuthProvider.BEARER_ONLY].includes(this.config.auth);
  }

  isApiKeyAuthEnabled(): boolean {
    return [AuthProvider.COMPOSITE, AuthProvider.API_KEY_ONLY].includes(this.config.auth);
  }

  // Logging feature checkers
  isDetailedLoggingEnabled(): boolean {
    return this.config.logging === LoggingProvider.DETAILED;
  }

  isRequestLoggingEnabled(): boolean {
    return this.config.logging === LoggingProvider.DETAILED;
  }

  // Configuration display
  logConfig(): void {
    this.logger.log('🚀 Feature Flags Configuration:');
    this.logger.log(`   🗄️  Database: ${this.config.database}`);
    this.logger.log(`   📊 Error Tracking: ${this.config.errorTracking}`);
    this.logger.log(`   🔐 Authentication: ${this.config.auth}`);
    this.logger.log(`   💾 Cache: ${this.config.cache}`);
    this.logger.log(`   📚 Documentation: ${this.config.documentation}`);
    this.logger.log(`   📝 Logging: ${this.config.logging}`);
    this.logger.log(`   ⚡ Performance: ${this.config.performance}`);
    this.logger.log('');
    this.logger.log('✅ All feature validations passed');
    this.logger.log('🎯 Application ready with selected feature set');
  }

  getProviderDescription(provider: string): string {
    return PROVIDER_DESCRIPTIONS[provider] || `Unknown provider: ${provider}`;
  }

  getAllProviderDescriptions(): Record<string, string> {
    return { ...PROVIDER_DESCRIPTIONS };
  }
}