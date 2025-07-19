# CloudWeave

A unified cloud platform engineering application for managing multi-cloud infrastructure, deployments, and operations. CloudWeave provides developers and platform engineers with powerful tools to weave together multi-cloud environments seamlessly.

## Preview
<img width="1511" height="824" alt="Screenshot 2025-07-19 at 11 15 30 AM" src="https://github.com/user-attachments/assets/ed935072-ceb5-423a-b200-3ea5a968d68f" />

## Features

- **Multi-cloud Management**: Unified interface for AWS, Azure, and GCP resources
- **Self-service Deployments**: Automated application deployment with multiple strategies
- **Monitoring & Observability**: Centralized monitoring and alerting across all environments
- **Security & Compliance**: Automated policy enforcement and compliance reporting
- **Cost Optimization**: Real-time cost tracking and optimization recommendations
- **Configuration Management**: Secure configuration and secrets management

## Architecture

The application follows a microservices architecture with the following core services:

- **Authentication Service**: JWT-based authentication and RBAC
- **Infrastructure Service**: Multi-cloud resource management
- **Deployment Service**: Application deployment automation
- **Monitoring Service**: Metrics collection and alerting
- **Security Service**: Policy enforcement and compliance
- **Cost Management Service**: Cost tracking and optimization
- **Configuration Service**: Configuration and secrets management

## Technology Stack

- **Backend**: Node.js with TypeScript and Express.js
- **Database**: PostgreSQL with Redis for caching
- **Authentication**: JWT with bcrypt for password hashing
- **Container**: Docker with Kubernetes for orchestration
- **Testing**: Jest with Supertest for API testing
- **Linting**: ESLint with TypeScript support

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Redis 6+
- Docker (optional)

### Database Setup

CloudWeave uses PostgreSQL as its primary database. Make sure you have PostgreSQL installed and running.

1. Create a database for CloudWeave:
```sql
CREATE DATABASE cloud_platform_db;
CREATE DATABASE cloud_platform_test_db; -- for testing
```

2. Set up your database connection in `.env`:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloud_platform_db
DB_USER=postgres
DB_PASSWORD=your_password
```

3. Run database migrations:
```bash
npm run db:migrate
```

4. Seed the database with initial data:
```bash
npm run db:seed
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CloudWeave
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

### Development Commands

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues

# Database
npm run db:migrate  # Run database migrations
npm run db:rollback # Rollback last migration
npm run db:seed     # Seed database with initial data
npm run db:reset    # Reset database (rollback all + migrate + seed)

# Docker
npm run docker:build # Build Docker image
npm run docker:run   # Run Docker container
```

### API Documentation

The API follows RESTful conventions with the following base structure:

```
/api/v1/
  /auth/           # Authentication endpoints
  /infrastructure/ # Infrastructure management
  /deployments/    # Deployment management
  /monitoring/     # Monitoring and metrics
  /security/       # Security and compliance
  /cost/          # Cost management
  /config/        # Configuration management
```

### Health Check

The application provides a health check endpoint:

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2023-10-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

## Deployment

### Kubernetes

Deploy to Kubernetes using the provided manifests:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
```

### Environment Variables

Key environment variables that need to be configured:

- `JWT_SECRET`: Secret key for JWT token signing
- `DB_HOST`, `DB_PASSWORD`: Database connection details
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: AWS credentials
- `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`: Azure credentials
- `GCP_PROJECT_ID`, `GCP_KEY_FILENAME`: GCP credentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details
