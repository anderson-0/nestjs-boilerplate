# Feature Flags System Guide

## Overview

The Todo Boilerplate includes a comprehensive feature flag system that allows you to enable/disable various features and switch between different service providers without code changes. This system is particularly powerful for error tracking, where you can choose between Bugsnag, Sentry, or PostHog.

## Supported Feature Flags

### Error Tracking
- **Provider Options**: `bugsnag`, `sentry`, `posthog`, `none`
- **Toggle**: Enable/disable error tracking entirely

### Database
- **Provider Options**: `prisma`, `drizzle`, `prisma-mongodb`
- **Multi-provider support**: Switch between different ORMs

### Cache
- **Provider Options**: `redis`, `memory`
- **Toggle**: Enable/disable caching

### API Documentation
- **Toggle**: Enable/disable Swagger documentation

### Authentication
- **Toggle**: Enable/disable authentication
- **Bearer Token**: Enable/disable JWT authentication
- **API Key**: Enable/disable API key authentication

### Performance
- **Throttling**: Enable/disable rate limiting
- **Compression**: Enable/disable response compression
- **Benchmarking**: Enable/disable performance monitoring

### Logging
- **Levels**: `error`, `warn`, `info`, `debug`
- **Request Logging**: Enable/disable HTTP request logging

## Environment Configuration

### Basic Setup (.env)
```bash
# Error Tracking Provider
ERROR_TRACKING_PROVIDER=bugsnag     # Options: bugsnag, sentry, posthog, none
ERROR_TRACKING_ENABLED=true

# Database Provider
DB_ADAPTER=prisma                   # Options: prisma, drizzle, prisma-mongodb

# Feature Toggles
CACHE_ENABLED=true
SWAGGER_ENABLED=true
AUTH_ENABLED=true
ENABLE_THROTTLING=true
ENABLE_COMPRESSION=true
LOG_LEVEL=info                      # Options: error, warn, info, debug

# Error Tracking Credentials
BUGSNAG_API_KEY=your-bugsnag-key-here
SENTRY_DSN=your-sentry-dsn-here
POSTHOG_API_KEY=your-posthog-api-key-here
POSTHOG_HOST=https://app.posthog.com
```

### Test Environment (.env.test)
```bash
# Disable most features for testing
ERROR_TRACKING_PROVIDER=none
ERROR_TRACKING_ENABLED=false
SWAGGER_ENABLED=false
ENABLE_THROTTLING=false
LOG_LEVEL=error
```

## Error Tracking Providers

### 1. Bugsnag
**Best for**: Traditional error monitoring with detailed error reports
```bash
ERROR_TRACKING_PROVIDER=bugsnag
BUGSNAG_API_KEY=your-bugsnag-key-here
```

**Features**:
- ✅ Exception tracking
- ✅ Breadcrumbs
- ✅ User context
- ✅ Custom metadata
- ✅ Release tracking
- ✅ Performance monitoring

### 2. Sentry
**Best for**: Comprehensive error monitoring with performance insights
```bash
ERROR_TRACKING_PROVIDER=sentry
SENTRY_DSN=your-sentry-dsn-here
```

**Features**:
- ✅ Exception tracking
- ✅ Performance monitoring
- ✅ Profiling
- ✅ Custom events
- ✅ User context
- ✅ Release tracking
- ✅ Distributed tracing

### 3. PostHog
**Best for**: Combined analytics and error tracking
```bash
ERROR_TRACKING_PROVIDER=posthog
POSTHOG_API_KEY=your-posthog-api-key-here
POSTHOG_HOST=https://app.posthog.com
```

**Features**:
- ✅ Exception tracking
- ✅ Event analytics
- ✅ User behavior tracking
- ✅ Feature flags (separate)
- ✅ A/B testing
- ✅ Session recordings
- ✅ Custom events

## Usage Examples

### Switching Error Tracking Providers

1. **To Bugsnag**:
```bash
ERROR_TRACKING_PROVIDER=bugsnag
BUGSNAG_API_KEY=your-actual-key
```

2. **To Sentry**:
```bash
ERROR_TRACKING_PROVIDER=sentry
SENTRY_DSN=https://your-key@sentry.io/project-id
```

3. **To PostHog**:
```bash
ERROR_TRACKING_PROVIDER=posthog
POSTHOG_API_KEY=phc_your-posthog-key
```

4. **Disable Error Tracking**:
```bash
ERROR_TRACKING_PROVIDER=none
ERROR_TRACKING_ENABLED=false
```

### Switching Database Providers

1. **PostgreSQL with Prisma**:
```bash
DB_ADAPTER=prisma
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

2. **PostgreSQL with Drizzle**:
```bash
DB_ADAPTER=drizzle
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

3. **MongoDB with Prisma**:
```bash
DB_ADAPTER=prisma-mongodb
MONGODB_URL=mongodb://user:pass@localhost:27017/db
```

## Application Startup

When you start the application, you'll see a configuration summary:

```
🚀 Feature Flags Configuration:
   📊 Error Tracking: bugsnag (enabled)
   🗄️ Database Adapter: prisma
   💾 Cache Provider: redis (enabled)
   📚 Swagger: enabled
   🔐 Authentication: enabled
   📝 Log Level: info
   ⚡ Throttling: enabled
```

## Programmatic Usage

### In Services
```typescript
import { UnifiedErrorTrackingService } from './common/error-tracking';

@Injectable()
export class YourService {
  constructor(private errorTracking: UnifiedErrorTrackingService) {}

  async doSomething() {
    try {
      // Your logic here
    } catch (error) {
      // This will use whichever provider is configured
      this.errorTracking.captureException(error, {
        context: 'YourService.doSomething',
        userId: 'user-123',
      });
    }
  }
}
```

### Feature Flag Checks
```typescript
import { FeatureFlagsService } from './common/config/feature-flags.config';

@Injectable()
export class YourService {
  constructor(private featureFlags: FeatureFlagsService) {}

  doSomething() {
    if (this.featureFlags.isErrorTrackingEnabled()) {
      // Error tracking is enabled
    }

    if (this.featureFlags.isCacheEnabled()) {
      // Caching is enabled
    }
  }
}
```

## Analytics with PostHog

When using PostHog as your error tracking provider, you also get analytics capabilities:

```typescript
// Track custom events
this.errorTracking.trackEvent('feature_used', userId, {
  feature: 'todo_creation',
  plan: 'premium'
});

// Track API calls
this.errorTracking.trackApiCall(userId, 'POST', '/api/todos', 201, 150);
```

## Best Practices

### 1. Environment-Specific Configuration
- **Development**: Use detailed logging and enable all debugging features
- **Staging**: Mirror production settings but with more verbose logging
- **Production**: Minimize logging, enable error tracking, disable Swagger

### 2. Error Tracking Strategy
- **Small Teams**: Start with Bugsnag for simplicity
- **Growing Teams**: Sentry for performance monitoring
- **Product-Focused**: PostHog for combined analytics and error tracking

### 3. Database Provider Selection
- **SQL-First**: Use Prisma for type safety and migrations
- **Performance-Critical**: Use Drizzle for better performance
- **Document Store**: Use Prisma MongoDB for flexible schemas

### 4. Testing
- Always disable error tracking in tests (`ERROR_TRACKING_PROVIDER=none`)
- Use minimal features in test environment for faster execution

## Troubleshooting

### Error Tracking Not Working
1. Check provider credentials are correct
2. Verify `ERROR_TRACKING_ENABLED=true`
3. Check network connectivity to provider service
4. Review application logs for initialization errors

### Database Connection Issues
1. Verify `DB_ADAPTER` matches your database setup
2. Check connection strings for the selected provider
3. Ensure database containers are running

### Feature Flags Not Applied
1. Restart the application after changing environment variables
2. Check for typos in environment variable names
3. Verify `.env` file is in the correct location

## Migration Guide

### From Single Provider to Multi-Provider
1. Add new provider credentials to environment
2. Change `ERROR_TRACKING_PROVIDER` value
3. Restart application
4. Verify new provider is receiving data

### From Bugsnag-Only to Unified System
1. Install new dependencies: `bun add @sentry/node posthog-node`
2. Update imports from `BugsnagService` to `UnifiedErrorTrackingService`
3. Set `ERROR_TRACKING_PROVIDER=bugsnag` to maintain current behavior
4. Gradually migrate to new provider when ready

This feature flag system provides maximum flexibility while maintaining type safety and ease of use across your entire application.