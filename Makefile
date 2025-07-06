.PHONY: help build deploy-local deploy-prod deploy-k8s stop clean

# Default target
help:
	@echo "Unhook Deployment Commands:"
	@echo ""
	@echo "Local Development:"
	@echo "  make build          - Build Docker images"
	@echo "  make deploy-local   - Deploy locally with Docker Compose"
	@echo "  make stop           - Stop all services"
	@echo "  make clean          - Stop services and remove volumes"
	@echo ""
	@echo "Production Deployment:"
	@echo "  make deploy-prod    - Deploy with nginx proxy"
	@echo "  make deploy-k8s     - Deploy to Kubernetes"
	@echo ""
	@echo "Utilities:"
	@echo "  make logs           - View logs for all services"
	@echo "  make db-backup      - Backup database"
	@echo "  make db-restore     - Restore database from backup.sql"
	@echo ""
	@echo "Testing:"
	@echo "  make test-integ     - Run integration tests"
	@echo "  make test-integ-watch - Run tests in watch mode"
	@echo "  make test-integ-ci  - Run tests for CI/CD"
	@echo "  make test-integ-local - Run tests with local DB"

# Build Docker images
build:
	docker-compose build

# Deploy locally for development
deploy-local: check-env
	./deploy/scripts/deploy-docker.sh --build

# Deploy with production configuration
deploy-prod: check-env
	./deploy/scripts/deploy-docker.sh --build --production

# Deploy to Kubernetes
deploy-k8s:
	./deploy/scripts/deploy-kubernetes.sh

# Stop all services
stop:
	docker-compose down

# Clean up everything (including volumes)
clean:
	docker-compose down -v

# View logs
logs:
	docker-compose logs -f

# Database backup
db-backup:
	@echo "Creating database backup..."
	docker-compose exec postgres pg_dump -U unhook unhook > backup-$(shell date +%Y%m%d-%H%M%S).sql
	@echo "Backup created successfully"

# Database restore
db-restore:
	@echo "Restoring database from backup.sql..."
	@test -f backup.sql || (echo "backup.sql not found" && exit 1)
	docker-compose exec -T postgres psql -U unhook unhook < backup.sql
	@echo "Database restored successfully"

# Check if .env exists
check-env:
	@test -f .env || (echo "Error: .env file not found. Run 'cp .env.example .env' and configure it." && exit 1)

# Integration tests
test-integ:
	@echo "Running integration tests..."
	cd packages/integ-test && bun test

test-integ-watch:
	@echo "Running integration tests in watch mode..."
	cd packages/integ-test && bun test:watch

test-integ-ci:
	@echo "Running integration tests for CI..."
	cd packages/integ-test && bun test:ci

test-integ-local:
	@echo "Running integration tests with local database..."
	cd packages/integ-test && USE_LOCAL_DB=true bun test