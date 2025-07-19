# CloudWeave Testing Suite

This directory contains the comprehensive testing suite for the CloudWeave platform, including unit tests, integration tests, end-to-end tests, and performance tests.

## 📋 Test Structure

```
tests/
├── api/                    # API testing with Postman/Newman
│   ├── postman-collection.json
│   └── environment.json
├── e2e/                    # End-to-end tests with Playwright
│   ├── fixtures/
│   ├── pages/
│   ├── *.spec.ts
│   ├── global-setup.ts
│   └── global-teardown.ts
├── helpers/                # Test utilities and helpers
│   └── database.ts
├── integration/            # API integration tests
│   └── api.test.ts
├── performance/            # Performance testing with Artillery
│   └── load-test.yml
└── README.md              # This file
```

## 🧪 Test Types

### 1. Unit Tests
- **Location**: `src/**/*.test.ts`, `src/**/*.spec.ts`
- **Framework**: Jest with ts-jest
- **Coverage**: 90% target coverage
- **Purpose**: Test individual functions, classes, and modules in isolation

**Running Unit Tests:**
```bash
npm run test                # Run all unit tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

### 2. Integration Tests
- **Location**: `tests/integration/`
- **Framework**: Jest with Supertest
- **Purpose**: Test API endpoints and service interactions

**Running Integration Tests:**
```bash
npm run test:api           # Run API integration tests
```

### 3. End-to-End Tests
- **Location**: `tests/e2e/`
- **Framework**: Playwright
- **Purpose**: Test complete user workflows from frontend to backend

**Running E2E Tests:**
```bash
npm run test:e2e           # Run E2E tests headless
npm run test:e2e:ui        # Run E2E tests with UI
```

### 4. Performance Tests
- **Location**: `tests/performance/`
- **Framework**: Artillery
- **Purpose**: Load testing and performance validation

**Running Performance Tests:**
```bash
npm run test:performance   # Run load tests
```

### 5. API Tests
- **Location**: `tests/api/`
- **Framework**: Newman (Postman CLI)
- **Purpose**: API contract testing and validation

**Running API Tests:**
```bash
npm run test:api           # Run Postman collection tests
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional, for containerized testing)

### Setup Test Environment

1. **Install Dependencies:**
```bash
npm install
cd frontend && npm install && cd ..
```

2. **Setup Test Database:**
```bash
# Create test database
createdb cloudweave_test

# Set environment variables
export NODE_ENV=test
export TEST_DATABASE_URL="postgresql://test:test@localhost:5432/cloudweave_test"

# Run migrations
npm run db:migrate
```

3. **Install Browser Dependencies (for E2E tests):**
```bash
npx playwright install
```

### Running All Tests

**Using the Test Runner Script:**
```bash
./scripts/run-e2e-tests.sh
```

**Manual Execution:**
```bash
# Run all test types
npm run test:all

# Or run individually
npm run test              # Unit tests
npm run test:api          # API integration tests
npm run test:e2e          # E2E tests
npm run test:performance  # Performance tests
```

## 📊 Test Configuration

### Jest Configuration
- **File**: `jest.config.js`
- **Coverage Threshold**: 80% for branches, functions, lines, and statements
- **Test Environment**: Node.js
- **Setup**: `src/test/setup.ts`

### Playwright Configuration
- **File**: `playwright.config.ts`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Base URL**: `http://localhost:3000` (configurable)
- **Retries**: 2 on CI, 0 locally
- **Reporters**: HTML, JSON, JUnit

### Artillery Configuration
- **File**: `tests/performance/load-test.yml`
- **Phases**: Warm-up, Ramp-up, Sustained load, Peak load, Cool-down
- **Thresholds**: 
  - 95th percentile response time < 2s
  - 99th percentile response time < 5s
  - Success rate > 95%

## 🎯 Test Scenarios

### Critical User Journeys Covered

1. **Authentication Flow**
   - User registration and organization setup
   - Login/logout functionality
   - Session management and token refresh
   - Role-based access control

2. **Infrastructure Management**
   - Resource discovery and listing
   - Resource creation and configuration
   - Resource updates and deletion
   - Multi-cloud provider support

3. **Deployment Operations**
   - Pipeline creation and configuration
   - Deployment triggering and monitoring
   - Rollback functionality
   - Deployment history and logs

4. **Monitoring and Alerting**
   - Metrics collection and visualization
   - Alert rule creation and management
   - Alert acknowledgment and resolution
   - Dashboard functionality

5. **Security and Compliance**
   - Security policy enforcement
   - Compliance validation
   - Audit trail generation
   - Incident response

6. **Cost Management**
   - Cost tracking and allocation
   - Budget alerts and forecasting
   - Optimization recommendations
   - Cost reporting

## 🔧 Test Data Management

### Database Test Data
- **Setup**: Automated via migrations and seeds
- **Cleanup**: Automatic rollback after tests
- **Isolation**: Each test suite uses fresh data

### Test Users and Organizations
- **Admin User**: `admin@test.com` / `TestPassword123!`
- **Test Organization**: `Test Organization`
- **Additional Users**: Created dynamically per test

### Mock Data
- **Cloud Resources**: Simulated AWS/Azure/GCP resources
- **Metrics**: Generated time-series data
- **Deployments**: Mock deployment pipelines and history

## 📈 Performance Testing

### Load Test Scenarios
1. **Authentication Load**: 20% of traffic
2. **Infrastructure Operations**: 30% of traffic
3. **Deployment Operations**: 25% of traffic
4. **Monitoring Operations**: 15% of traffic
5. **Health Checks**: 10% of traffic

### Performance Thresholds
- **Response Time**: 95th percentile < 2 seconds
- **Throughput**: Minimum 45 requests/second
- **Success Rate**: > 95%
- **Error Rate**: < 5%

## 🔍 Debugging Tests

### E2E Test Debugging
```bash
# Run tests with UI mode for debugging
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.ts

# Run tests with debug mode
npx playwright test --debug

# Generate trace for failed tests
npx playwright test --trace on
```

### API Test Debugging
```bash
# Run with verbose output
newman run tests/api/postman-collection.json -e tests/api/environment.json --verbose

# Export detailed results
newman run tests/api/postman-collection.json -e tests/api/environment.json --reporters cli,json --reporter-json-export results.json
```

## 📋 Test Reports

### Coverage Reports
- **Location**: `coverage/lcov-report/index.html`
- **Format**: HTML, LCOV, JSON
- **Threshold**: 90% coverage target

### E2E Test Reports
- **Location**: `playwright-report/index.html`
- **Includes**: Test results, screenshots, videos, traces
- **CI Integration**: Uploaded as artifacts

### Performance Reports
- **Location**: `test-results/performance-report.html`
- **Metrics**: Response times, throughput, error rates
- **Trends**: Historical performance comparison

## 🚨 Continuous Integration

### GitHub Actions Workflow
- **File**: `.github/workflows/e2e-tests.yml`
- **Triggers**: Push, PR, scheduled (daily)
- **Jobs**: Unit tests, API tests, E2E tests, Performance tests, Security tests

### Test Execution Matrix
- **Node.js Versions**: 18, 20
- **Browsers**: Chrome, Firefox, Safari, Mobile
- **Databases**: PostgreSQL 14, 15
- **Operating Systems**: Ubuntu, macOS, Windows

## 🛠️ Maintenance

### Adding New Tests

1. **Unit Tests**: Add `*.test.ts` files alongside source code
2. **Integration Tests**: Add to `tests/integration/`
3. **E2E Tests**: Add `*.spec.ts` files to `tests/e2e/`
4. **Performance Tests**: Update `tests/performance/load-test.yml`

### Updating Test Data
1. **Database Schema**: Update migrations and seeds
2. **API Contracts**: Update Postman collection
3. **UI Elements**: Update page object models

### Test Environment Updates
1. **Dependencies**: Update package.json
2. **Configuration**: Update test config files
3. **CI/CD**: Update GitHub Actions workflow

## 📚 Best Practices

### Test Writing Guidelines
1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **Test Isolation**: Each test should be independent
4. **Data Cleanup**: Clean up test data after each test
5. **Error Handling**: Test both success and failure scenarios

### Performance Considerations
1. **Parallel Execution**: Run tests in parallel when possible
2. **Resource Management**: Clean up resources after tests
3. **Test Data Size**: Keep test data minimal but realistic
4. **Timeout Configuration**: Set appropriate timeouts

### Maintenance Guidelines
1. **Regular Updates**: Keep test dependencies updated
2. **Flaky Test Management**: Identify and fix unstable tests
3. **Test Coverage**: Maintain high test coverage
4. **Documentation**: Keep test documentation current

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check connection string and credentials
   - Ensure test database exists

2. **E2E Test Failures**
   - Check if services are running
   - Verify browser installation
   - Review test timeouts

3. **Performance Test Issues**
   - Ensure adequate system resources
   - Check network connectivity
   - Verify service capacity

4. **CI/CD Failures**
   - Check GitHub Actions logs
   - Verify environment variables
   - Review artifact uploads

### Getting Help
- **Documentation**: Check test-specific README files
- **Logs**: Review test execution logs
- **Issues**: Create GitHub issues for persistent problems
- **Team**: Contact the platform engineering team