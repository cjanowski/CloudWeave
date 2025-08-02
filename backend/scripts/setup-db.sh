#!/bin/bash

# CloudWeave Database Setup Script
# This script sets up a local PostgreSQL database for development

set -e

# Default values
DB_NAME="cloud_platform_db"
DB_USER="coryjanowski"
DB_PASSWORD=""
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}CloudWeave Database Setup${NC}"
echo "=========================="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL is not installed or not in PATH${NC}"
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL is not running${NC}"
    echo "Please start PostgreSQL first:"
    echo "  macOS: brew services start postgresql"
    echo "  Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

echo -e "${YELLOW}Setting up database: $DB_NAME${NC}"

# Create database if it doesn't exist
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}Database $DB_NAME already exists${NC}"
else
    echo "Creating database $DB_NAME..."
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    echo -e "${GREEN}Database $DB_NAME created successfully${NC}"
fi

# Test connection
echo "Testing database connection..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}Database connection successful${NC}"
else
    echo -e "${RED}Error: Could not connect to database${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Database setup complete!${NC}"
echo "You can now run the application with: go run cmd/main.go"
echo ""
echo "Database connection details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"