#!/bin/bash

# CloudWeave E2E Test Runner Script
# This script sets up the environment and runs comprehensive end-to-end tests

set -e  # Exit on any error

echo "🚀 Starting CloudWeave E2E Test Suite..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DB_NAME="cloudweave_test"
TEST_DB_USER="test"
TEST_DB_PASSWORD="test"
TEST_DB_HOST="localhost"
TEST_DB_PORT="5432"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within expected time"
    return 1
}

# Function to setup test database
setup_test_database() {
    print_status "Setting up test database..."
    
    # Check if PostgreSQL is running
    if ! command_exists psql; then
        print_error "PostgreSQL client (psql) not found. Please install PostgreSQL."
        exit 1
    fi
    
    # Create test database if it doesn't exist
    export PGPASSWORD=$TEST_DB_PASSWORD
    
    if ! psql -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER -lqt | cut -d \| -f 1 | grep -qw $TEST_DB_NAME; then
        print_status "Creating test database: $TEST_DB_NAME"
        createdb -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER $TEST_DB_NAME
    else
        print_status "Test database already exists: $TEST_DB_NAME"
    fi
    
    # Set environment variables for tests
    export NODE_ENV=test
    export TEST_DATABASE_URL="postgresql://$TEST_DB_USER:$TEST_DB_PASSWORD@$TEST_DB_HOST:$TEST_DB_PORT/$TEST_DB_NAME"
    export DATABASE_URL=$TEST_DATABASE_URL
    
    print_success "Test database setup complete"
}

# Function to start backend services
start_backend() {
    print_status "Starting backend services..."
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install
    fi
    
    # Run database migrations
    print_status "Running database migrations..."
    npm run db:migrate
    
    # Start backend server in background
    print_status "Starting backend server..."
    npm run dev &
    BACKEND_PID=$!
    
    # Wait for backend to be ready
    wait_for_service "http://localhost:3000/api/v1/health" "Backend API"
    
    print_success "Backend services started (PID: $BACKEND_PID)"
}

# Function to start frontend services
start_frontend() {
    print_status "Starting frontend services..."
    
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend server in background
    print_status "Starting frontend server..."
    npm run dev &
    FRONTEND_PID=$!
    
    cd ..
    
    # Wait for frontend to be ready
    wait_for_service "http://localhost:5173" "Frontend Application"
    
    print_success "Frontend services started (PID: $FRONTEND_PID)"
}

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    
    if npm run test:coverage; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Function to run API integration tests
run_api_tests() {
    print_status "Running API integration tests..."
    
    if npm run test:api; then
        print_success "API tests passed"
    else
        print_error "API tests failed"
        return 1
    fi
}

# Function to run E2E tests
run_e2e_tests() {
    print_status "Running E2E tests..."
    
    # Install Playwright browsers if needed
    if [ ! -d "~/.cache/ms-playwright" ]; then
        print_status "Installing Playwright browsers..."
        npx playwright install
    fi
    
    if npm run test:e2e; then
        print_success "E2E tests passed"
    else
        print_error "E2E tests failed"
        return 1
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    
    if npm run test:performance; then
        print_success "Performance tests passed"
    else
        print_warning "Performance tests failed or didn't meet thresholds"
        return 1
    fi
}

# Function to cleanup processes
cleanup() {
    print_status "Cleaning up test environment..."
    
    # Kill background processes
    if [ ! -z "$BACKEND_PID" ]; then
        print_status "Stopping backend server (PID: $BACKEND_PID)"
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        print_status "Stopping frontend server (PID: $FRONTEND_PID)"
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Clean up test database
    if [ "$CLEANUP_DB" = "true" ]; then
        print_status "Cleaning up test database..."
        export PGPASSWORD=$TEST_DB_PASSWORD
        dropdb -h $TEST_DB_HOST -p $TEST_DB_PORT -U $TEST_DB_USER $TEST_DB_NAME 2>/dev/null || true
    fi
    
    print_success "Cleanup complete"
}

# Function to generate test report
generate_report() {
    print_status "Generating test report..."
    
    # Create reports directory
    mkdir -p test-results
    
    # Combine test results
    echo "# CloudWeave E2E Test Report" > test-results/summary.md
    echo "Generated on: $(date)" >> test-results/summary.md
    echo "" >> test-results/summary.md
    
    if [ -f "coverage/lcov-report/index.html" ]; then
        echo "- ✅ Unit Test Coverage Report: coverage/lcov-report/index.html" >> test-results/summary.md
    fi
    
    if [ -f "playwright-report/index.html" ]; then
        echo "- ✅ E2E Test Report: playwright-report/index.html" >> test-results/summary.md
    fi
    
    if [ -f "test-results/e2e-results.json" ]; then
        echo "- ✅ E2E Test Results: test-results/e2e-results.json" >> test-results/summary.md
    fi
    
    print_success "Test report generated: test-results/summary.md"
}

# Main execution
main() {
    local run_unit=true
    local run_api=true
    local run_e2e=true
    local run_performance=false
    local cleanup_db=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-unit)
                run_unit=false
                shift
                ;;
            --skip-api)
                run_api=false
                shift
                ;;
            --skip-e2e)
                run_e2e=false
                shift
                ;;
            --include-performance)
                run_performance=true
                shift
                ;;
            --cleanup-db)
                cleanup_db=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-unit           Skip unit tests"
                echo "  --skip-api            Skip API integration tests"
                echo "  --skip-e2e            Skip E2E tests"
                echo "  --include-performance Include performance tests"
                echo "  --cleanup-db          Clean up test database after tests"
                echo "  --help                Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    export CLEANUP_DB=$cleanup_db
    
    # Set up trap for cleanup
    trap cleanup EXIT
    
    # Setup test environment
    setup_test_database
    start_backend
    start_frontend
    
    # Run tests
    local test_failures=0
    
    if [ "$run_unit" = true ]; then
        run_unit_tests || test_failures=$((test_failures + 1))
    fi
    
    if [ "$run_api" = true ]; then
        run_api_tests || test_failures=$((test_failures + 1))
    fi
    
    if [ "$run_e2e" = true ]; then
        run_e2e_tests || test_failures=$((test_failures + 1))
    fi
    
    if [ "$run_performance" = true ]; then
        run_performance_tests || test_failures=$((test_failures + 1))
    fi
    
    # Generate report
    generate_report
    
    # Final status
    if [ $test_failures -eq 0 ]; then
        print_success "🎉 All tests passed successfully!"
        exit 0
    else
        print_error "❌ $test_failures test suite(s) failed"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"