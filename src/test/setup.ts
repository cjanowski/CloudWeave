// Jest setup file for global test configuration

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DB_NAME = 'cloud_platform_test_db';

// Mock logger to avoid console output during tests
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Global test timeout
jest.setTimeout(10000);