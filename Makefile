# PDFTrackr Development Commands

.PHONY: help dev build up down logs clean install migrate seed

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies for both frontend and backend
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

dev: ## Start development environment
	docker-compose up --build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## Show logs from all services
	docker-compose logs -f

clean: ## Clean up containers, volumes, and networks
	docker-compose down -v --remove-orphans
	docker system prune -f

build: ## Build all Docker images
	docker-compose build

migrate: ## Run database migrations
	cd backend && npm run db:generate && npm run db:migrate

seed: ## Seed the database
	cd backend && npm run db:seed

studio: ## Open Drizzle Studio
	cd backend && npm run db:studio

prod-up: ## Start production environment
	docker-compose -f docker-compose.production.yml up -d

prod-down: ## Stop production environment
	docker-compose -f docker-compose.production.yml down

prod-logs: ## Show production logs
	docker-compose -f docker-compose.production.yml logs -f

# Database commands
db-reset: ## Reset database (development only)
	docker-compose down -v
	docker-compose up -d postgres redis
	sleep 5
	make migrate

# Quick development setup
setup: install db-reset seed ## Complete development setup

# Production deployment
deploy: ## Deploy to production (requires environment variables)
	@echo "Deploying to production..."
	docker-compose -f docker-compose.production.yml pull
	docker-compose -f docker-compose.production.yml up -d --build
	@echo "Deployment complete!"

# Health checks
health: ## Check service health
	@echo "Checking backend health..."
	curl -f http://localhost:3001/health || echo "Backend unhealthy"
	@echo "Checking frontend health..."
	curl -f http://localhost:3000 || echo "Frontend unhealthy"
	@echo "Checking Prometheus..."
	curl -f http://localhost:9090/-/healthy || echo "Prometheus unhealthy"
	@echo "Checking Grafana..."
	curl -f http://localhost:3001/api/health || echo "Grafana unhealthy"