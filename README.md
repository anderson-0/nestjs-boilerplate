# NestJS Boilerplate with Comprehensive Feature Flags

A production-ready NestJS boilerplate application featuring a comprehensive feature flag system, multi-database support, and 100% test coverage.

## 🚀 Features

### Core Features
- **RESTful API** with full CRUD operations for Todos
- **Multi-Database Support** - Choose between Prisma+PostgreSQL, Drizzle+PostgreSQL, or Mongoose+MongoDB
- **Comprehensive Feature Flag System** - Runtime configuration for all aspects of the application
- **100% Test Coverage** - Unit tests, integration tests, and E2E tests
- **Docker Support** - Complete containerization with development and production configurations
- **API Documentation** - Auto-generated Swagger/OpenAPI documentation

### Technical Stack
- **Framework**: NestJS with Fastify adapter
- **Databases**: PostgreSQL, MongoDB, Redis (configurable via feature flags)
- **ORMs**: Prisma, Drizzle ORM, Mongoose (switchable)
- **Validation**: Zod schemas with custom validation pipes
- **Caching**: Redis with cache-manager integration
- **Rate Limiting**: Built-in throttling with configurable limits
- **Error Tracking**: Sentry and Bugsnag integration
- **Authentication**: Composite auth system (configurable)
- **Testing**: Jest with comprehensive test suites

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Feature Flags](#feature-flags)
- [Database Configuration](#database-configuration)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Docker](#docker)
- [Development](#development)
- [Contributing](#contributing)

## 🚀 Quick Start

### Prerequisites
- Bun 1.0+ (faster than npm/pnpm)
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd boilerplate
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit environment variables
   nano .env
   ```

4. **Start infrastructure services**
   ```bash
   # Start PostgreSQL, MongoDB, and Redis
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   # For Prisma (default)
   bun run prisma:migrate

   # For Drizzle
   bun run drizzle:migrate
   ```

6. **Start the application**
   ```bash
   # Development mode
   bun run start:dev

   # Production mode
   bun run build
   bun run start:prod
   ```

The API will be available at `http://localhost:3000/api`

## ⚙️ Environment Configuration

### Required Environment Variables

```env
# Database Configuration
DATABASE_PROVIDER=prisma-postgresql  # Options: prisma-postgresql, drizzle-postgresql, mongoose-mongodb
DATABASE_URL=postgresql://user:password@localhost:5432/db
MONGODB_URL=mongodb://localhost:27017/db  # Required if using mongoose-mongodb

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Application Settings
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Feature Flags
AUTH_PROVIDER=composite  # Options: none, basic, jwt, oauth, composite
CACHE_PROVIDER=redis     # Options: memory, redis
ERROR_TRACKING_PROVIDER=none  # Options: none, sentry, bugsnag, posthog
DOCUMENTATION_PROVIDER=swagger  # Options: none, swagger
LOGGING_PROVIDER=basic   # Options: none, basic, winston, pino
PERFORMANCE_PROVIDER=basic  # Options: none, basic, datadog, newrelic
```

### Environment-Specific Files
- `.env` - Local development
- `.env.test` - Test environment
- `.env.production` - Production environment

## 🎛️ Feature Flags

The application uses a comprehensive feature flag system that allows runtime configuration of all major components:

### Database Providers
```typescript
DATABASE_PROVIDER=prisma-postgresql    # Prisma ORM with PostgreSQL
DATABASE_PROVIDER=drizzle-postgresql   # Drizzle ORM with PostgreSQL
DATABASE_PROVIDER=mongoose-mongodb     # Mongoose ODM with MongoDB
```

### Authentication Providers
```typescript
AUTH_PROVIDER=none        # No authentication
AUTH_PROVIDER=basic       # Basic authentication
AUTH_PROVIDER=jwt         # JWT-based authentication
AUTH_PROVIDER=oauth       # OAuth integration
AUTH_PROVIDER=composite   # Multiple auth methods
```

### Cache Providers
```typescript
CACHE_PROVIDER=memory     # In-memory caching
CACHE_PROVIDER=redis      # Redis caching
```

### Error Tracking
```typescript
ERROR_TRACKING_PROVIDER=none      # No error tracking
ERROR_TRACKING_PROVIDER=sentry    # Sentry integration
ERROR_TRACKING_PROVIDER=bugsnag   # Bugsnag integration
ERROR_TRACKING_PROVIDER=posthog   # PostHog integration
```

For complete feature flag documentation, see [FEATURE_FLAG_SYSTEM.md](./FEATURE_FLAG_SYSTEM.md).

## 🗄️ Database Configuration

### Supported Databases

#### 1. Prisma + PostgreSQL (Default)
```bash
# Set environment
DATABASE_PROVIDER=prisma-postgresql
DATABASE_URL=postgresql://user:password@localhost:5432/db

# Run migrations
bun run prisma:migrate
bun run prisma:generate
```

#### 2. Drizzle + PostgreSQL
```bash
# Set environment
DATABASE_PROVIDER=drizzle-postgresql
DATABASE_URL=postgresql://user:password@localhost:5432/db

# Run migrations
bun run drizzle:generate
bun run drizzle:migrate
```

#### 3. Mongoose + MongoDB
```bash
# Set environment
DATABASE_PROVIDER=mongoose-mongodb
MONGODB_URL=mongodb://localhost:27017/db

# No migrations needed - schemas auto-created
```

### Switching Databases
The application automatically configures the correct ORM/ODM based on the `DATABASE_PROVIDER` environment variable. No code changes required!

## 🧪 Testing

### Test Coverage
The project maintains **100% test coverage** with comprehensive test suites:

- **Unit Tests**: Service and controller tests
- **Integration Tests**: Repository tests for all database providers
- **E2E Tests**: Full API endpoint testing
- **Repository Tests**: Database-specific implementation tests

### Running Tests

```bash
# Run all tests
bun test

# Run tests with coverage
bun run test:cov

# Run E2E tests
bun run test:e2e

# Run specific test files
bun test -- todos.service.spec.ts
bun test -- --testPathPatterns="repository\.spec\.ts"
```

### Test Structure
```
src/
├── todos/
│   ├── todos.service.spec.ts          # Service unit tests
│   ├── todos.controller.spec.ts       # Controller tests
│   └── repositories/
│       ├── prisma-todo.repository.spec.ts
│       ├── drizzle-todo.repository.spec.ts
│       └── mongoose-todo.repository.spec.ts
test/
├── todos.e2e-spec.ts                  # E2E API tests
└── test-todos.controller.ts           # Test-specific controller
```

### Test Commands
```bash
# Development testing
bun run test:watch

# Debug tests
bun run test:debug

# Test specific database provider
DATABASE_PROVIDER=drizzle-postgresql bun test
```

## 📚 API Documentation

### Swagger Documentation
When `DOCUMENTATION_PROVIDER=swagger`, interactive API documentation is available at:
- Development: `http://localhost:3000/api/docs`
- Production: `https://your-domain.com/api/docs`

### API Endpoints

#### Todos API
```
GET    /api/todos              # Get all todos
POST   /api/todos              # Create a new todo
GET    /api/todos/:id          # Get todo by ID
PATCH  /api/todos/:id          # Update todo
DELETE /api/todos/:id          # Delete todo
GET    /api/todos/completed    # Get todos by completion status
GET    /api/todos/by-tags      # Get todos by tags
```

#### Health Check
```
GET    /api/health             # Application health status
```

### Request/Response Examples

#### Create Todo
```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn NestJS",
    "description": "Complete the NestJS tutorial",
    "priority": "high",
    "tags": ["learning", "backend"]
  }'
```

#### Update Todo
```bash
curl -X PATCH http://localhost:3000/api/todos/123 \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true,
    "priority": "medium"
  }'
```

## 🐳 Docker

### Development with Docker Compose
```bash
# Start all services (PostgreSQL, MongoDB, Redis)
docker-compose up -d

# Start only specific services
docker-compose up -d postgres redis

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Production Docker Build
```bash
# Build production image
docker build -t nestjs-boilerplate .

# Run production container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  nestjs-boilerplate
```

### Docker Services
- **PostgreSQL**: Port 5432 (for Prisma/Drizzle)
- **MongoDB**: Port 27017 (for Mongoose)
- **Redis**: Port 6379 (caching)

## 💻 Development

### Development Workflow
```bash
# Start development server with hot reload
bun run start:dev

# Run linting
bun run lint
bun run lint:fix

# Format code
bun run format

# Type checking
bun run typecheck

# Build for production
bun run build
```

### Project Structure
```
src/
├── common/                    # Shared modules
│   ├── cache/                # Caching infrastructure
│   ├── config/               # Configuration and feature flags
│   ├── entities/             # Domain entities
│   ├── errors/               # Error handling
│   ├── repositories/         # Database abstractions
│   │   ├── prisma/          # Prisma implementation
│   │   ├── drizzle/         # Drizzle implementation
│   │   └── mongoose/        # Mongoose implementation
│   ├── swagger/             # API documentation
│   └── validation/          # Validation schemas
├── todos/                    # Todos feature module
│   ├── repositories/        # Todo-specific repositories
│   ├── todos.controller.ts  # REST controllers
│   ├── todos.service.ts     # Business logic
│   └── todos.module.ts      # Module configuration
├── app.module.ts             # Root application module
└── main.ts                   # Application bootstrap
```

### Adding New Features
1. **Create Feature Module**
   ```bash
   nest generate module features/new-feature
   nest generate service features/new-feature
   nest generate controller features/new-feature
   ```

2. **Add Repository Layer**
   - Implement interface in `repositories/`
   - Add implementations for each database provider
   - Update repository factory

3. **Add Tests**
   - Unit tests for service and controller
   - Repository tests for all providers
   - E2E tests for API endpoints

4. **Update Documentation**
   - Add API endpoints to Swagger
   - Update README if needed

### Code Quality Tools
- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **Jest**: Testing framework
- **TypeScript**: Static type checking

## 🔧 Configuration Management

### Feature Flag Configuration
The application uses a centralized feature flag system in `src/common/config/feature-flags.config.ts`:

```typescript
// Get current database provider
const dbProvider = featureFlagsService.getDatabaseProvider();

// Check if caching is enabled
const isCachingEnabled = featureFlagsService.isCachingEnabled();

// Get error tracking provider
const errorProvider = featureFlagsService.getErrorTrackingProvider();
```

### Validation
All environment variables are validated at startup with detailed error messages for missing or invalid configurations.

### Dynamic Configuration
Feature flags allow switching providers without code changes - only environment variable updates required.

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database URLs
- [ ] Set up Redis cluster (if using Redis cache)
- [ ] Configure error tracking (Sentry/Bugsnag)
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting for production traffic
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domains

### Environment-Specific Deployment
```bash
# Staging
NODE_ENV=staging bun run start:prod

# Production
NODE_ENV=production bun run start:prod
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Ensure all tests pass: `bun test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Coding Standards
- Follow TypeScript best practices
- Maintain 100% test coverage
- Use conventional commit messages
- Update documentation for new features
- Add proper error handling
- Include validation for all inputs

### Testing Requirements
- All new features must include unit tests
- Controllers must have integration tests
- New database operations need repository tests
- API changes require E2E test updates

## 🚀 Deployment

This boilerplate is **production-ready** with standardized infrastructure configurations:

### ⚡ Quick Deploy
```bash
# Local development with Docker
make dev

# Production deployment (requires AWS setup)
# See deployment guides in parent directory
```

### 📚 Deployment Options

| Method | Command | Documentation |
|--------|---------|---------------|
| **🐳 Local Docker** | `make dev` | [Docker Guide](./DOCKER.md) |
| **☸️ AWS EKS** | Terraform + GitHub Actions | [Deployment Guide](../DEPLOYMENT_GUIDE.md) |
| **🏗️ Infrastructure** | `terraform/` | [Terraform Guide](./terraform/README.md) |

### 🏗️ Infrastructure Specifications
- **Instance Type**: t3.medium
- **Scaling**: Min: 2, Max: 10, Desired: 3
- **Availability Zones**: 3 AZs
- **Capacity**: ON_DEMAND instances
- **Monthly Cost**: ~$270/month

### 📖 Deployment Documentation
- **[📋 Complete Deployment Guide](../DEPLOYMENT_GUIDE.md)** - Full setup instructions
- **[⚡ Quick Start Guide](../DEPLOY_QUICK_START.md)** - 15-minute deployment
- **[🐳 Docker Guide](./DOCKER.md)** - Local development setup
- **[🏗️ Terraform Guide](./terraform/README.md)** - Infrastructure deployment

**Ready for production deployment with identical infrastructure as the main kodey-backend app!** 🚀

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Check existing documentation
- Review feature flag configuration
- Verify environment setup

## 🔗 Related Documentation

- [Feature Flag System Guide](./FEATURE_FLAG_SYSTEM.md)
- [Comprehensive Feature Flags Action Plan](./COMPREHENSIVE_FEATURE_FLAGS_ACTION_PLAN.md)
- [Feature Flags Implementation Guide](./FEATURE_FLAGS_GUIDE.md)
- [Boilerplate Action List](./BOILERPLATE_ACTION_LIST.md)