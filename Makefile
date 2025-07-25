# CloudWeave Go Backend Makefile

.PHONY: run build test clean dev frontend backend

# Development commands
dev: backend frontend

backend:
	@echo "Starting Go backend server..."
	cd backend && go run cmd/main.go

frontend:
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

# Build commands
build:
	@echo "Building Go backend..."
	cd backend && go build -o bin/cloudweave cmd/main.go

# Test commands
test:
	@echo "Running Go tests..."
	cd backend && go test ./...

# Clean commands
clean:
	@echo "Cleaning build artifacts..."
	cd backend && rm -rf bin/

# Install dependencies
install:
	@echo "Installing Go dependencies..."
	cd backend && go mod tidy
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Format code
fmt:
	@echo "Formatting Go code..."
	cd backend && go fmt ./...

# Run linter
lint:
	@echo "Running Go linter..."
	cd backend && golangci-lint run

# Database commands
db-setup:
	@echo "Setting up database..."
	cd backend && chmod +x scripts/setup-db.sh && ./scripts/setup-db.sh

db-migrate:
	@echo "Running database migrations..."
	cd backend && go run cmd/migrate/main.go -action=up

db-rollback:
	@echo "Rolling back last migration..."
	cd backend && go run cmd/migrate/main.go -action=down

db-version:
	@echo "Checking migration version..."
	cd backend && go run cmd/migrate/main.go -action=version

db-reset:
	@echo "Resetting database (WARNING: This will drop all data)..."
	cd backend && dropdb cloud_platform_db || true
	cd backend && createdb cloud_platform_db
	cd backend && go run cmd/migrate/main.go -action=up

# Docker commands
docker-build:
	docker build -t cloudweave-go .

docker-run:
	docker run -p 3001:3001 cloudweave-go