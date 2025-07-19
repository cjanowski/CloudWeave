/**
 * Jest Setup for Security Tests
 * Configures the testing environment for security test suites
 */

// Jest types are automatically available

// Extend Jest timeout for security tests
jest.setTimeout(120000); // 2 minutes for comprehensive security tests

// Global test configuration
beforeAll(() => {
  // Ensure test environment variables are set
  process.env.NODE_ENV = 'test';
  process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  
  // Security test specific environment variables
  process.env.SECURITY_TEST_MODE = 'true';
  process.env.VULNERABILITY_SCANNING = 'true';
  process.env.COMPLIANCE_TESTING = 'true';
});

// Global error handling for security tests
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection in security tests:', reason);
});

// Mock console methods for cleaner test output
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  // Suppress expected warnings in security tests
  console.warn = jest.fn().mockImplementation((message) => {
    if (!message.includes('Security test warning') && !message.includes('Expected security')) {
      originalConsoleWarn(message);
    }
  });
  
  console.error = jest.fn().mockImplementation((message) => {
    if (!message.includes('Expected security error')) {
      originalConsoleError(message);
    }
  });
});

afterEach(() => {
  // Restore console methods
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Export test utilities
export const securityTestUtils = {
  timeout: 120000,
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  isSecurityTestMode: () => process.env.SECURITY_TEST_MODE === 'true'
};