// Database & ORM Providers
export enum DatabaseProvider {
  PRISMA_POSTGRESQL = 'prisma-postgresql',
  DRIZZLE_POSTGRESQL = 'drizzle-postgresql',
  MONGOOSE_MONGODB = 'mongoose-mongodb',
}

// Error Tracking Providers
export enum ErrorTrackingProvider {
  BUGSNAG = 'bugsnag',
  SENTRY = 'sentry',
  POSTHOG = 'posthog',
  NONE = 'none',
}

// Authentication Providers
export enum AuthProvider {
  COMPOSITE = 'composite',
  BEARER_ONLY = 'bearer-only',
  API_KEY_ONLY = 'api-key-only',
  NONE = 'none',
}

// Cache Providers
export enum CacheProvider {
  REDIS = 'redis',
  MEMORY = 'memory',
  NONE = 'none',
}

// Documentation Providers
export enum DocumentationProvider {
  SWAGGER = 'swagger',
  NONE = 'none',
}

// Logging Providers
export enum LoggingProvider {
  DETAILED = 'detailed',
  BASIC = 'basic',
  NONE = 'none',
}

// Performance Providers
export enum PerformanceProvider {
  FULL = 'full',
  BASIC = 'basic',
  NONE = 'none',
}

// Feature Provider Collections for validation
export const VALID_PROVIDERS = {
  DATABASE: Object.values(DatabaseProvider),
  ERROR_TRACKING: Object.values(ErrorTrackingProvider),
  AUTH: Object.values(AuthProvider),
  CACHE: Object.values(CacheProvider),
  DOCUMENTATION: Object.values(DocumentationProvider),
  LOGGING: Object.values(LoggingProvider),
  PERFORMANCE: Object.values(PerformanceProvider),
} as const;

// Provider descriptions for documentation
export const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  // Database providers
  'prisma-postgresql': 'Prisma ORM with PostgreSQL database',
  'drizzle-postgresql': 'Drizzle ORM with PostgreSQL database',
  'mongoose-mongodb': 'Mongoose ODM with MongoDB database',

  // Error tracking providers
  'bugsnag': 'Bugsnag error monitoring and tracking',
  'sentry': 'Sentry error monitoring with performance insights',
  'posthog': 'PostHog analytics with error tracking',
  'error-tracking-none': 'No error tracking enabled',

  // Auth providers
  'composite': 'Multiple authentication methods (Bearer + API Key)',
  'bearer-only': 'JWT Bearer token authentication only',
  'api-key-only': 'API key authentication only',
  'auth-none': 'No authentication required',

  // Cache providers
  'redis': 'Redis-based caching system',
  'memory': 'In-memory caching system',
  'cache-none': 'No caching enabled',

  // Documentation providers
  'swagger': 'Swagger/OpenAPI documentation',
  'documentation-none': 'No API documentation',

  // Logging providers
  'detailed': 'Detailed logging with request/response data',
  'logging-basic': 'Basic error and warning logging',
  'logging-none': 'No application logging',

  // Performance providers
  'full': 'All performance features (Throttling + Compression + Benchmarking)',
  'performance-basic': 'Basic performance features (Throttling + Compression)',
  'performance-none': 'No performance optimizations',
};