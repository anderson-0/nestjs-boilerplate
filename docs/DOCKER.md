# 🐳 Docker Setup Guide for Kodey Boilerplate

This guide covers all Docker-related operations for the Kodey Boilerplate application.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Make (optional, for convenience commands)

## 🚀 Quick Start

### Development Environment

```bash
# Using Make (recommended)
make dev

# Or using Docker Compose directly
docker-compose up -d
```

Your application will be available at:
- **API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MongoDB**: localhost:27017
- **LocalStack (AWS)**: localhost:4566

### Production Environment

```bash
# Setup environment variables
cp .env.example .env.production
# Edit .env.production with your production values

# Deploy production stack
make prod

# Or using Docker Compose directly
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 Docker Files Overview

### Core Files
- **`Dockerfile`** - Multi-stage production-ready image
- **`docker-compose.yml`** - Development environment
- **`docker-compose.prod.yml`** - Production environment
- **`.dockerignore`** - Files excluded from Docker context

### Configuration Files
- **`nginx/nginx.conf`** - Nginx reverse proxy configuration
- **`.env.example`** - Environment variables template
- **`Makefile`** - Convenience commands

## 🔧 Available Make Commands

```bash
make help           # Show all available commands
make build          # Build the Docker image
make dev            # Start development environment
make prod           # Start production environment
make db-setup       # Start databases only
make test           # Run tests
make logs           # View application logs
make shell          # Open shell in container
make clean          # Clean up containers and volumes
make restart        # Restart application
make status         # View container status
```

## 🏗️ Dockerfile Explanation

### Multi-Stage Build

Our Dockerfile uses a multi-stage build for optimal image size:

1. **Builder Stage**: Installs dependencies and builds the application
2. **Production Stage**: Creates minimal runtime image

### Key Features
- 📦 **Alpine Linux** for minimal size
- 👤 **Non-root user** for security
- 🏥 **Health checks** built-in
- 📊 **Proper signal handling** with dumb-init
- 🔐 **Security hardening**

### Image Size Optimization
- Production dependencies only
- Multi-stage build
- .dockerignore for build context
- Alpine base image

## 🗄️ Database Configurations

### Development Databases
- **PostgreSQL**: `todo_user:todo_password@localhost:5432/todo_db`
- **Redis**: `localhost:6379`
- **MongoDB**: `todo_user:todo_password@localhost:27017/todo_db`

### Test Databases
- **PostgreSQL**: `test_user:test_password@localhost:5433/todo_test`
- **Redis**: `localhost:6380`
- **MongoDB**: `test_user:test_password@localhost:27018/todo_test`

### Production Databases
Configure via environment variables in `.env.production`

## 🔒 Environment Variables

### Required Variables
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-secret-here
```

### Optional Variables
```bash
# AWS Configuration
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
BUGSNAG_API_KEY=your-bugsnag-key

# Performance
CACHE_TTL=300
THROTTLE_LIMIT=1000
```

## 🚀 Deployment Strategies

### 1. Development Deployment
```bash
# Start full stack
make dev

# View logs
make logs

# Run database migrations
make db-migrate
```

### 2. Production Deployment
```bash
# Build optimized image
make build

# Deploy production stack
make deploy-prod

# Monitor deployment
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Testing Environment
```bash
# Start test databases
make test-db

# Run tests
make test

# Clean up
docker-compose down
```

## 🔍 Monitoring & Debugging

### View Logs
```bash
# Application logs
make logs

# All services logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f postgres
```

### Container Status
```bash
# View running containers
make status

# Detailed container info
docker-compose ps -a

# Resource usage
docker stats
```

### Debug Container
```bash
# Open shell in running container
make shell

# Run one-off commands
docker-compose exec app pnpm prisma:studio
```

## 🔧 Maintenance

### Database Operations
```bash
# Run migrations
docker-compose exec app pnpm prisma:migrate

# Generate Prisma client
docker-compose exec app pnpm prisma:generate

# Open Prisma Studio
docker-compose exec app pnpm prisma:studio
```

### Backup & Restore
```bash
# Backup production database
make backup-db

# Restore from backup
make restore-db
```

### Updates & Cleanup
```bash
# Update dependencies and rebuild
docker-compose build --no-cache

# Clean up unused resources
make clean

# Full reset
make reset
```

## 🏥 Health Checks

### Application Health Check
The application includes a built-in health check endpoint:
- **Endpoint**: `GET /api/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3

### Database Health Checks
All databases include health checks:
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`
- **MongoDB**: `mongosh ping`

## 🔐 Security Considerations

### Container Security
- ✅ Non-root user (nestjs:1001)
- ✅ Read-only root filesystem
- ✅ No privileged escalation
- ✅ Minimal attack surface

### Network Security
- ✅ Custom bridge network
- ✅ Service isolation
- ✅ No host network mode

### Nginx Security
- ✅ Rate limiting
- ✅ Security headers
- ✅ SSL/TLS configuration
- ✅ Request size limits

## 🚨 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using the port
lsof -i :3000

# Use different ports
docker-compose up -d --scale app=0
```

#### Database Connection Issues
```bash
# Check database status
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Reset database
docker-compose down -v
make dev
```

#### Memory Issues
```bash
# Check container resources
docker stats

# Increase memory limits in docker-compose.yml
# services.app.deploy.resources.limits.memory: "2G"
```

#### Build Issues
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Performance Tuning

#### PostgreSQL Optimization
```sql
-- Add to postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

#### Redis Optimization
```conf
# Add to redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
```

#### Node.js Optimization
```bash
# Environment variables
NODE_OPTIONS=--max-old-space-size=1024
UV_THREADPOOL_SIZE=128
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Node.js Docker Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PostgreSQL Docker Guide](https://hub.docker.com/_/postgres)

---

💡 **Pro Tip**: Use `make help` to see all available commands and `make dev` for quick development setup!