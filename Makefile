# Makefile for Kodey Boilerplate Docker Operations

.PHONY: help build run dev prod test clean logs shell db-setup db-migrate

# Default target
help:
	@echo "Available commands:"
	@echo "  build        - Build the Docker image"
	@echo "  run          - Run the application with dependencies"
	@echo "  dev          - Start development environment"
	@echo "  prod         - Start production environment"
	@echo "  test         - Run tests in containers"
	@echo "  clean        - Clean up containers and volumes"
	@echo "  logs         - View application logs"
	@echo "  shell        - Open shell in running container"
	@echo "  db-setup     - Setup databases for development"
	@echo "  db-migrate   - Run database migrations"

# Build the Docker image
build:
	docker build -t kodey-boilerplate:latest .

# Run the full development stack
dev:
	docker-compose up -d
	@echo "Development environment started!"
	@echo "Application: http://localhost:3000"
	@echo "API Docs: http://localhost:3000/api/docs"
	@echo "PostgreSQL: localhost:5432"
	@echo "Redis: localhost:6379"
	@echo "MongoDB: localhost:27017"

# Run production environment
prod:
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Production environment started!"

# Setup development databases only
db-setup:
	docker-compose up -d postgres redis mongodb localstack
	@echo "Databases started!"

# Setup test databases
test-db:
	docker-compose up -d test-postgres test-redis test-mongodb
	@echo "Test databases started!"

# Run database migrations
db-migrate:
	docker-compose exec app pnpm prisma:migrate
	@echo "Database migrations completed!"

# Run the application only (assumes databases are running)
run:
	docker-compose up app

# Run tests
test:
	docker-compose up -d test-postgres test-redis test-mongodb
	docker-compose exec app pnpm test
	docker-compose exec app pnpm test:e2e

# View logs
logs:
	docker-compose logs -f app

# Open shell in running container
shell:
	docker-compose exec app sh

# Clean up everything
clean:
	docker-compose down -v
	docker-compose -f docker-compose.prod.yml down -v
	docker system prune -f
	@echo "Cleanup completed!"

# Stop development environment
stop:
	docker-compose down

# Stop production environment
stop-prod:
	docker-compose -f docker-compose.prod.yml down

# Restart application
restart:
	docker-compose restart app

# View container status
status:
	docker-compose ps

# Build and run
build-run: build dev

# Full reset (clean + build + run)
reset: clean build dev

# Production deployment
deploy-prod: build
	docker-compose -f docker-compose.prod.yml up -d --build
	@echo "Production deployment completed!"

# Backup production database
backup-db:
	docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U $$POSTGRES_USER kodey_boilerplate_prod > ./backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Database backup completed!"

# Restore production database
restore-db:
	@read -p "Enter backup file name: " backup_file; \
	docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $$POSTGRES_USER -d kodey_boilerplate_prod < ./backups/$$backup_file
	@echo "Database restore completed!"