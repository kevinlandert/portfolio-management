.PHONY: help dev up down logs frontend-shell backend-shell test clean rebuild

help:        ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

dev:        ## Start development stack (builds and starts containers)
	docker compose up --build

up:         ## Start containers in detached mode
	docker compose up -d

down:       ## Stop and remove containers, volumes, and networks
	docker compose down -v

logs:       ## Show logs from all services (follow mode, last 200 lines)
	docker compose logs -f --tail=200

frontend-logs:  ## Show only frontend logs
	docker compose logs -f frontend-dev

backend-logs:   ## Show only backend logs (when enabled)
	docker compose logs -f backend

frontend-shell: ## Open shell in frontend container
	docker compose exec frontend-dev sh

init-db:   ## Initialize database
	docker compose exec backend-dev python database/scripts/init_db.py

backend-shell:  ## Open shell in backend container
	docker compose exec backend-dev bash

restart:    ## Restart all services
	docker compose restart

rebuild:    ## Rebuild containers from scratch (no cache)
	docker compose build --no-cache
	docker compose up -d

clean:      ## Stop containers and remove volumes
	docker compose down -v
	docker system prune -f

test:       ## Run tests with coverage
	@echo "Backend tests:"
	@docker compose up -d backend-dev 2>/dev/null || true
	@docker compose exec backend-dev pytest --cov=app --cov-report=term-missing --cov-report=html -q || echo "Tests failed"
	@echo ""
	@echo "📊 Coverage report generated:"
	@echo "   file://$$(pwd)/backend/htmlcov/index.html"
	@echo "   (Click the link above or open in browser)"

test-clean: ## Run tests in fresh container with coverage (thorough - rebuilds and tears down)
	@echo "Backend tests (clean):"
	@docker compose up -d --build backend-dev
	@docker compose exec backend-dev pytest --cov=app --cov-report=term-missing --cov-report=html -q || echo "Tests failed"
	@docker compose stop backend-dev
	@echo ""
	@echo "📊 Coverage report generated:"
	@echo "   file://$$(pwd)/backend/htmlcov/index.html"
	@echo "   (Click the link above or open in browser)"
	@echo "Test container stopped"

# Database commands (for future when you add PostgreSQL)
db-shell:   ## Connect to database (when PostgreSQL service is added)
	docker compose exec db psql -U appuser -d appdb

makemigration: ## Create new Alembic migration (when backend has migrations)
	docker compose exec backend alembic revision --autogenerate -m "change"

migrate:    ## Run database migrations (when backend has migrations)
	docker compose exec backend alembic upgrade head

# Production commands (for future)
prod-build: ## Build production images
	docker compose -f docker-compose.prod.yml build

prod-up:    ## Start production stack
	docker compose -f docker-compose.prod.yml up -d