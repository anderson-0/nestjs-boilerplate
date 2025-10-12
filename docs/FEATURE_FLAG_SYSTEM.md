# Comprehensive Feature Flag System

This document describes the comprehensive feature flag system that allows runtime configuration of all major application components without code changes.

## 🎯 Overview

The feature flag system enables:
- **Runtime Configuration**: Switch components via environment variables
- **Zero Code Changes**: Complete provider switching without rebuilds
- **Multi-Provider Support**: Database, cache, auth, error tracking, and more
- **Production Safety**: Validated configurations with clear error messages
- **Development Flexibility**: Easy local development with different stacks

## 🏗️ Architecture

### Core Components

1. **FeatureFlagsService** (`src/common/config/feature-flags.config.ts`)
   - Central configuration management
   - Environment variable validation
   - Provider selection logic
   - Configuration logging

2. **RepositoryModule** (`src/common/repositories/repository.module.ts`)
   - Dynamic database provider selection
   - Repository factory pattern implementation
   - Dependency injection configuration

3. **Feature Providers Enum** (`src/common/config/feature-providers.enum.ts`)
   - TypeScript enums for all provider types
   - Compile-time type safety
   - IDE autocomplete support

### How It Works

```mermaid
graph TD
    A[Environment Variables] --> B[FeatureFlagsService]
    B --> C[Configuration Validation]
    C --> D[Provider Selection]
    D --> E[Repository Factory]
    D --> F[Cache Factory]
    D --> G[Auth Factory]
    D --> H[Error Tracking Factory]
    E --> I[TodosService]
    F --> I
    G --> I
    H --> I
```

## 🗄️ Database Provider System

### Supported Database Providers

```typescript
enum DatabaseProvider {
  PRISMA_POSTGRESQL = 'prisma-postgresql',
  DRIZZLE_POSTGRESQL = 'drizzle-postgresql',
  MONGOOSE_MONGODB = 'mongoose-mongodb',
}
```

### Configuration

```bash
# Environment variable
DATABASE_PROVIDER=prisma-postgresql

# Required URLs based on provider
DATABASE_URL=postgresql://user:pass@localhost:5432/db      # For PostgreSQL providers
MONGODB_URL=mongodb://localhost:27017/db                   # For MongoDB provider
```

### Implementation Details

#### 1. Repository Interface
All database providers implement the same interface:

```typescript
interface ITodoRepository {
  create(data: CreateTodoInput): Promise<Todo>;
  findAll(): Promise<Todo[]>;
  findById(id: string): Promise<Todo | null>;
  update(id: string, data: UpdateTodoInput): Promise<Todo>;
  delete(id: string): Promise<Todo>;
  deleteAll(): Promise<void>;
  findByCompleted(completed: boolean): Promise<Todo[]>;
  findByTags(tags: string[]): Promise<Todo[]>;
}
```

#### 2. Provider Factory
```typescript
// Repository selection logic
const createRepositoryProvider = (config: RepositoryConfig) => {
  return {
    provide: config.provide,
    useFactory: (
      featureFlagsService: FeatureFlagsService,
      prismaRepo: PrismaTodoRepository,
      drizzleRepo: DrizzleTodoRepository,
      mongooseRepo: MongooseTodoRepository,
    ) => {
      const provider = featureFlagsService.getDatabaseProvider();

      switch (provider) {
        case DatabaseProvider.PRISMA_POSTGRESQL:
          return prismaRepo;
        case DatabaseProvider.DRIZZLE_POSTGRESQL:
          return drizzleRepo;
        case DatabaseProvider.MONGOOSE_MONGODB:
          return mongooseRepo;
        default:
          throw new Error(`Unsupported database provider: ${provider}`);
      }
    },
    inject: [
      FeatureFlagsService,
      config.prismaRepository,
      config.drizzleRepository,
      config.mongooseRepository,
    ],
  };
};
```

#### 3. Database-Specific Implementations

**Prisma Repository** (`src/todos/repositories/prisma-todo.repository.ts`):
```typescript
@Injectable()
export class PrismaTodoRepository implements ITodoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTodoInput): Promise<Todo> {
    const created = await this.prisma.todo.create({
      data: {
        ...data,
        tags: data.tags || [],
      },
    });

    return {
      ...created,
      metadata: created.metadata as Record<string, any> | undefined,
    } as Todo;
  }

  async findAll(): Promise<Todo[]> {
    const todos = await this.prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return todos.map(todo => ({
      ...todo,
      metadata: todo.metadata as Record<string, any> | undefined,
    })) as Todo[];
  }

  // ... other methods
}
```

**Drizzle Repository** (`src/todos/repositories/drizzle-todo.repository.ts`):
```typescript
@Injectable()
export class DrizzleTodoRepository implements ITodoRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: CreateTodoInput): Promise<Todo> {
    const newTodo = {
      id: createId(),
      ...data,
      tags: data.tags || [],
      completed: data.completed ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [created] = await this.drizzle.db
      .insert(todos)
      .values(newTodo)
      .returning();

    return created as Todo;
  }

  async findAll(): Promise<Todo[]> {
    const result = await this.drizzle.db
      .select()
      .from(todos)
      .orderBy(todos.createdAt);

    return result as Todo[];
  }

  // ... other methods
}
```

**Mongoose Repository** (`src/todos/repositories/mongoose-todo.repository.ts`):
```typescript
@Injectable()
export class MongooseTodoRepository implements ITodoRepository {
  constructor(@InjectModel('Todo') private readonly todoModel: Model<TodoDocument>) {}

  async create(data: CreateTodoInput): Promise<Todo> {
    const created = new this.todoModel({
      ...data,
      tags: data.tags || [],
      completed: data.completed ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await created.save();
    return this.mapDocumentToEntity(created);
  }

  async findAll(): Promise<Todo[]> {
    const todos = await this.todoModel
      .find()
      .sort({ createdAt: -1 })
      .exec();

    return todos.map(todo => this.mapDocumentToEntity(todo));
  }

  // ... other methods
}
```

### Switching Database Providers

```bash
# Switch to Drizzle + PostgreSQL
DATABASE_PROVIDER=drizzle-postgresql
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Switch to Mongoose + MongoDB
DATABASE_PROVIDER=mongoose-mongodb
MONGODB_URL=mongodb://localhost:27017/db

# Switch to Prisma + PostgreSQL (default)
DATABASE_PROVIDER=prisma-postgresql
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

**No code changes required** - just restart the application!

## 🔐 Authentication Provider System

### Supported Authentication Providers

```typescript
enum AuthProvider {
  NONE = 'none',
  BASIC = 'basic',
  JWT = 'jwt',
  OAUTH = 'oauth',
  COMPOSITE = 'composite',
}
```

### Configuration
```bash
AUTH_PROVIDER=composite  # Enable multiple auth methods
JWT_SECRET=your-secret-key
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret
```

### Implementation
```typescript
// Auth guard selection
@Injectable()
export class AuthGuardFactory {
  createGuard(provider: AuthProvider): CanActivate {
    switch (provider) {
      case AuthProvider.NONE:
        return new NoAuthGuard();
      case AuthProvider.BASIC:
        return new BasicAuthGuard();
      case AuthProvider.JWT:
        return new JwtAuthGuard();
      case AuthProvider.OAUTH:
        return new OAuthGuard();
      case AuthProvider.COMPOSITE:
        return new CompositeAuthGuard();
      default:
        throw new Error(`Unsupported auth provider: ${provider}`);
    }
  }
}
```

## 💾 Cache Provider System

### Supported Cache Providers

```typescript
enum CacheProvider {
  MEMORY = 'memory',
  REDIS = 'redis',
}
```

### Configuration
```bash
CACHE_PROVIDER=redis
REDIS_URL=redis://localhost:6379

# Memory cache configuration (for CACHE_PROVIDER=memory)
CACHE_TTL=300000  # 5 minutes
CACHE_MAX_ITEMS=1000
```

### Implementation
```typescript
// Cache module configuration
@Module({})
export class CacheConfigModule {
  static forRoot(): DynamicModule {
    return {
      module: CacheConfigModule,
      imports: [
        CacheModule.registerAsync({
          useFactory: (featureFlags: FeatureFlagsService) => {
            const provider = featureFlags.getCacheProvider();

            if (provider === CacheProvider.REDIS) {
              return {
                store: redisStore,
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                ttl: 60000,
                max: 100,
              };
            }

            return {
              ttl: 60000,
              max: 100,
            };
          },
          inject: [FeatureFlagsService],
        }),
      ],
      exports: [CacheModule],
    };
  }
}
```

## 📊 Error Tracking Provider System

### Supported Error Tracking Providers

```typescript
enum ErrorTrackingProvider {
  NONE = 'none',
  SENTRY = 'sentry',
  BUGSNAG = 'bugsnag',
  POSTHOG = 'posthog',
}
```

### Configuration
```bash
ERROR_TRACKING_PROVIDER=sentry
SENTRY_DSN=https://xxx@sentry.io/xxx

# Or for Bugsnag
ERROR_TRACKING_PROVIDER=bugsnag
BUGSNAG_API_KEY=your-bugsnag-key

# Or for PostHog
ERROR_TRACKING_PROVIDER=posthog
POSTHOG_API_KEY=your-posthog-key
```

### Implementation
```typescript
// Error tracking service factory
@Injectable()
export class ErrorTrackingFactory {
  createService(provider: ErrorTrackingProvider): IErrorTrackingService {
    switch (provider) {
      case ErrorTrackingProvider.NONE:
        return new NoOpErrorTrackingService();
      case ErrorTrackingProvider.SENTRY:
        return new SentryService();
      case ErrorTrackingProvider.BUGSNAG:
        return new BugsnagService();
      case ErrorTrackingProvider.POSTHOG:
        return new PostHogService();
      default:
        throw new Error(`Unsupported error tracking provider: ${provider}`);
    }
  }
}
```

## 📚 Documentation Provider System

### Supported Documentation Providers

```typescript
enum DocumentationProvider {
  NONE = 'none',
  SWAGGER = 'swagger',
}
```

### Configuration
```bash
DOCUMENTATION_PROVIDER=swagger
```

### Implementation
```typescript
// Conditional Swagger setup
if (featureFlags.isDocumentationEnabled()) {
  const config = new DocumentBuilder()
    .setTitle('NestJS Boilerplate API')
    .setDescription('Comprehensive NestJS API with feature flags')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
```

## 🚀 Performance Monitoring Provider System

### Supported Performance Providers

```typescript
enum PerformanceProvider {
  NONE = 'none',
  BASIC = 'basic',
  DATADOG = 'datadog',
  NEWRELIC = 'newrelic',
}
```

### Configuration
```bash
PERFORMANCE_PROVIDER=datadog
DATADOG_API_KEY=your-datadog-key
DATADOG_APP_KEY=your-app-key
```

## 📝 Logging Provider System

### Supported Logging Providers

```typescript
enum LoggingProvider {
  NONE = 'none',
  BASIC = 'basic',
  WINSTON = 'winston',
  PINO = 'pino',
}
```

### Configuration
```bash
LOGGING_PROVIDER=winston
LOG_LEVEL=info
LOG_FORMAT=json
```

## ⚙️ Feature Flag Configuration Service

### Core Service Implementation

```typescript
@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(private configService: ConfigService) {
    this.validateConfiguration();
  }

  // Database Provider
  getDatabaseProvider(): DatabaseProvider {
    return this.getValidatedProvider<DatabaseProvider>(
      'DATABASE_PROVIDER',
      Object.values(DatabaseProvider),
      DatabaseProvider.PRISMA_POSTGRESQL,
    );
  }

  // Cache Provider
  getCacheProvider(): CacheProvider {
    return this.getValidatedProvider<CacheProvider>(
      'CACHE_PROVIDER',
      Object.values(CacheProvider),
      CacheProvider.MEMORY,
    );
  }

  // Auth Provider
  getAuthProvider(): AuthProvider {
    return this.getValidatedProvider<AuthProvider>(
      'AUTH_PROVIDER',
      Object.values(AuthProvider),
      AuthProvider.NONE,
    );
  }

  // Error Tracking Provider
  getErrorTrackingProvider(): ErrorTrackingProvider {
    return this.getValidatedProvider<ErrorTrackingProvider>(
      'ERROR_TRACKING_PROVIDER',
      Object.values(ErrorTrackingProvider),
      ErrorTrackingProvider.NONE,
    );
  }

  // Utility Methods
  isAuthEnabled(): boolean {
    return this.getAuthProvider() !== AuthProvider.NONE;
  }

  isCachingEnabled(): boolean {
    return this.getCacheProvider() !== CacheProvider.MEMORY;
  }

  isErrorTrackingEnabled(): boolean {
    return this.getErrorTrackingProvider() !== ErrorTrackingProvider.NONE;
  }

  isDocumentationEnabled(): boolean {
    return this.getDocumentationProvider() === DocumentationProvider.SWAGGER;
  }

  // Configuration validation
  private validateConfiguration(): void {
    const dbProvider = this.getDatabaseProvider();

    // Validate database URLs
    if ([DatabaseProvider.PRISMA_POSTGRESQL, DatabaseProvider.DRIZZLE_POSTGRESQL].includes(dbProvider)) {
      const dbUrl = this.configService.get<string>('DATABASE_URL');
      if (!dbUrl) {
        throw new Error('DATABASE_URL is required for PostgreSQL providers');
      }
    }

    if (dbProvider === DatabaseProvider.MONGOOSE_MONGODB) {
      const mongoUrl = this.configService.get<string>('MONGODB_URL');
      if (!mongoUrl) {
        throw new Error('MONGODB_URL is required for MongoDB provider');
      }
    }

    // Validate auth configuration
    if (this.getAuthProvider() === AuthProvider.JWT) {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is required for JWT auth provider');
      }
    }

    // Validate cache configuration
    if (this.getCacheProvider() === CacheProvider.REDIS) {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      if (!redisUrl) {
        throw new Error('REDIS_URL is required for Redis cache provider');
      }
    }

    this.logConfiguration();
  }

  // Configuration logging
  logConfiguration(): void {
    this.logger.log('🎛️  Feature Flag Configuration:');
    this.logger.log(`   Database: ${this.getDatabaseProvider()}`);
    this.logger.log(`   Cache: ${this.getCacheProvider()}`);
    this.logger.log(`   Auth: ${this.getAuthProvider()}`);
    this.logger.log(`   Error Tracking: ${this.getErrorTrackingProvider()}`);
    this.logger.log(`   Documentation: ${this.getDocumentationProvider()}`);
    this.logger.log(`   Logging: ${this.getLoggingProvider()}`);
    this.logger.log(`   Performance: ${this.getPerformanceProvider()}`);
  }

  // Generic provider validation
  private getValidatedProvider<T extends string>(
    envVar: string,
    validOptions: readonly T[],
    defaultValue: T,
  ): T {
    const value = this.configService.get<string>(envVar, defaultValue);

    if (!validOptions.includes(value as T)) {
      throw new Error(
        `Invalid ${envVar}: "${value}". Valid options: ${validOptions.join(', ')}`,
      );
    }

    return value as T;
  }
}
```

## 🔄 Runtime Provider Switching

### Example: Switching Database Providers

1. **Current Configuration**
   ```bash
   DATABASE_PROVIDER=prisma-postgresql
   DATABASE_URL=postgresql://user:pass@localhost:5432/db
   ```

2. **Switch to Drizzle**
   ```bash
   # Update environment
   DATABASE_PROVIDER=drizzle-postgresql
   # DATABASE_URL remains the same

   # Restart application
   npm run start:prod
   ```

3. **Switch to MongoDB**
   ```bash
   # Update environment
   DATABASE_PROVIDER=mongoose-mongodb
   MONGODB_URL=mongodb://localhost:27017/db

   # Restart application
   npm run start:prod
   ```

### Example: Enabling Error Tracking

```bash
# Before (no error tracking)
ERROR_TRACKING_PROVIDER=none

# After (enable Sentry)
ERROR_TRACKING_PROVIDER=sentry
SENTRY_DSN=https://xxx@sentry.io/xxx

# Restart application to apply changes
```

## 🧪 Testing with Feature Flags

### Test Configuration

```typescript
// Test environment configuration
const testConfig = {
  DATABASE_PROVIDER: 'prisma-postgresql',
  CACHE_PROVIDER: 'memory',
  AUTH_PROVIDER: 'none',
  ERROR_TRACKING_PROVIDER: 'none',
  DOCUMENTATION_PROVIDER: 'none',
};

// Test module setup
beforeEach(async () => {
  const module = await Test.createTestingModule({
    providers: [
      FeatureFlagsService,
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn((key: string, defaultValue?: any) => {
            return testConfig[key] || defaultValue;
          }),
        },
      },
    ],
  }).compile();
});
```

### Testing Different Providers

```typescript
describe('Feature Flag Provider Switching', () => {
  it('should use Prisma repository when DATABASE_PROVIDER=prisma-postgresql', () => {
    process.env.DATABASE_PROVIDER = 'prisma-postgresql';
    const service = new FeatureFlagsService(configService);
    expect(service.getDatabaseProvider()).toBe('prisma-postgresql');
  });

  it('should use Drizzle repository when DATABASE_PROVIDER=drizzle-postgresql', () => {
    process.env.DATABASE_PROVIDER = 'drizzle-postgresql';
    const service = new FeatureFlagsService(configService);
    expect(service.getDatabaseProvider()).toBe('drizzle-postgresql');
  });
});
```

## 📊 Benefits

### 1. **Zero Downtime Provider Switching**
- Change providers with just environment variables
- No code rebuilds required
- Hot-swappable configurations

### 2. **Development Flexibility**
- Test with different database providers locally
- Switch between cloud and local services easily
- Experiment with new providers without code changes

### 3. **Production Safety**
- Comprehensive validation of all configurations
- Clear error messages for invalid setups
- Type-safe provider selections

### 4. **Operational Excellence**
- Configuration logging for debugging
- Health checks for all providers
- Graceful fallbacks where possible

### 5. **Team Productivity**
- Developers can use preferred tools locally
- Easy A/B testing of different providers
- Simplified deployment configurations

This comprehensive feature flag system provides the foundation for a highly configurable, maintainable, and scalable NestJS application.