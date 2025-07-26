import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorHandler } from '../errorHandler';
import type { ApiError } from '../apiService';

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: { DEV: false, PROD: true },
  writable: true,
});

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserFriendlyError', () => {
    it('should return specific error for known error codes', () => {
      const error: ApiError = {
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
        status: 0,
      };

      const result = ErrorHandler.getUserFriendlyError(error);

      expect(result).toEqual({
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        action: 'Retry',
        severity: 'error',
        retryable: true,
      });
    });

    it('should return error based on HTTP status when code is not recognized', () => {
      const error: ApiError = {
        message: 'Unauthorized access',
        code: 'UNKNOWN_CODE',
        status: 401,
      };

      const result = ErrorHandler.getUserFriendlyError(error);

      expect(result).toEqual({
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again to continue.',
        action: 'Log In',
        severity: 'warning',
        retryable: false,
      });
    });

    it('should return error based on message pattern', () => {
      const error: ApiError = {
        message: 'Email already exists in the system',
        status: 400,
      };

      const result = ErrorHandler.getUserFriendlyError(error);

      expect(result).toEqual({
        title: 'Email Already Registered',
        message: 'An account with this email address already exists. Try logging in instead.',
        action: 'Log In',
        severity: 'error',
        retryable: false,
      });
    });

    it('should return user-friendly message when original message is appropriate', () => {
      const error: ApiError = {
        message: 'Your password must be at least 8 characters long',
        // No status to avoid status-based matching
      };

      const result = ErrorHandler.getUserFriendlyError(error);

      expect(result).toEqual({
        title: 'Error',
        message: 'Your password must be at least 8 characters long',
        severity: 'error',
        retryable: false,
      });
    });

    it('should return default error for technical messages', () => {
      const error: ApiError = {
        message: 'axios request failed with CORS preflight error',
        status: 500,
      };

      const result = ErrorHandler.getUserFriendlyError(error);

      expect(result).toEqual({
        title: 'Server Error',
        message: 'Something went wrong on our end. Our team has been notified and is working on a fix.',
        action: 'Try Again Later',
        severity: 'error',
        retryable: true,
      });
    });

    it('should handle missing error properties', () => {
      const error: ApiError = {
        message: 'Something went wrong',
      };

      const result = ErrorHandler.getUserFriendlyError(error);

      expect(result).toEqual({
        title: 'Error',
        message: 'Something went wrong',
        severity: 'error',
        retryable: false,
      });
    });
  });

  describe('formatValidationErrors', () => {
    it('should format validation errors correctly', () => {
      const errors = {
        email: ['Email is required', 'Email format is invalid'],
        password: ['Password is too short'],
        name: ['Name cannot be empty'],
      };

      const result = ErrorHandler.formatValidationErrors(errors);

      expect(result).toBe(
        'Email: Email is required, Email format is invalid\n' +
        'Password: Password is too short\n' +
        'Name: Name cannot be empty'
      );
    });

    it('should return default message for empty errors', () => {
      const errors = {};

      const result = ErrorHandler.formatValidationErrors(errors);

      expect(result).toBe('Please check your input and try again.');
    });

    it('should handle single error per field', () => {
      const errors = {
        username: ['Username is already taken'],
      };

      const result = ErrorHandler.formatValidationErrors(errors);

      expect(result).toBe('Username: Username is already taken');
    });
  });

  describe('shouldShowRetryButton', () => {
    it('should return true for retryable errors with error severity', () => {
      const error = {
        title: 'Network Error',
        message: 'Connection failed',
        severity: 'error' as const,
        retryable: true,
      };

      const result = ErrorHandler.shouldShowRetryButton(error);

      expect(result).toBe(true);
    });

    it('should return true for retryable errors with warning severity', () => {
      const error = {
        title: 'Timeout',
        message: 'Request timed out',
        severity: 'warning' as const,
        retryable: true,
      };

      const result = ErrorHandler.shouldShowRetryButton(error);

      expect(result).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error = {
        title: 'Validation Error',
        message: 'Invalid input',
        severity: 'error' as const,
        retryable: false,
      };

      const result = ErrorHandler.shouldShowRetryButton(error);

      expect(result).toBe(false);
    });

    it('should return false for info severity even if retryable', () => {
      const error = {
        title: 'Maintenance',
        message: 'System under maintenance',
        severity: 'info' as const,
        retryable: true,
      };

      const result = ErrorHandler.shouldShowRetryButton(error);

      expect(result).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should return exponential backoff delay', () => {
      const delay1 = ErrorHandler.getRetryDelay(0);
      const delay2 = ErrorHandler.getRetryDelay(1);
      const delay3 = ErrorHandler.getRetryDelay(2);

      expect(delay1).toBeGreaterThanOrEqual(750); // 1000 - 25% jitter
      expect(delay1).toBeLessThanOrEqual(1250); // 1000 + 25% jitter

      expect(delay2).toBeGreaterThanOrEqual(1500); // 2000 - 25% jitter
      expect(delay2).toBeLessThanOrEqual(2500); // 2000 + 25% jitter

      expect(delay3).toBeGreaterThanOrEqual(3000); // 4000 - 25% jitter
      expect(delay3).toBeLessThanOrEqual(5000); // 4000 + 25% jitter
    });

    it('should cap delay at maximum value', () => {
      const delay = ErrorHandler.getRetryDelay(10); // Very high attempt count

      expect(delay).toBeLessThanOrEqual(37500); // 30000 + 25% jitter
    });

    it('should never return delay less than 1 second', () => {
      const delay = ErrorHandler.getRetryDelay(0);

      expect(delay).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('logError', () => {
    it('should log error in development mode', () => {
      // Mock DEV environment
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true, PROD: false },
        writable: true,
      });

      const error: ApiError = {
        message: 'Test error',
        code: 'TEST_ERROR',
        status: 500,
      };

      ErrorHandler.logError(error, 'test context');

      expect(mockConsoleError).toHaveBeenCalledWith(
        'API Error:',
        expect.objectContaining({
          timestamp: expect.any(String),
          context: 'test context',
          error: {
            message: 'Test error',
            code: 'TEST_ERROR',
            status: 500,
            details: undefined,
          },
          userAgent: expect.any(String),
          url: expect.any(String),
        })
      );
    });

    it('should not log to console in production mode', () => {
      // Mock PROD environment by temporarily overriding the env check
      const originalEnv = import.meta.env;
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: false, PROD: true },
        writable: true,
        configurable: true,
      });

      const error: ApiError = {
        message: 'Test error',
        code: 'TEST_ERROR',
        status: 500,
      };

      ErrorHandler.logError(error);

      expect(mockConsoleError).not.toHaveBeenCalled();

      // Restore original env
      Object.defineProperty(import.meta, 'env', {
        value: originalEnv,
        writable: true,
        configurable: true,
      });
    });

    it('should include all error details in log', () => {
      // Mock DEV environment
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true, PROD: false },
        writable: true,
      });

      const error: ApiError = {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        status: 422,
        details: {
          field: 'email',
          errors: { email: ['Invalid format'] },
        },
      };

      ErrorHandler.logError(error, 'form validation');

      expect(mockConsoleError).toHaveBeenCalledWith(
        'API Error:',
        expect.objectContaining({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            status: 422,
            details: {
              field: 'email',
              errors: { email: ['Invalid format'] },
            },
          },
        })
      );
    });
  });

  describe('Error Message Patterns', () => {
    it('should detect weak password pattern', () => {
      const error: ApiError = {
        message: 'Password is too weak and does not meet requirements',
        status: 400,
      };

      const result = ErrorHandler.getUserFriendlyError(error);

      expect(result.title).toBe('Password Too Weak');
    });

    it('should detect invalid credentials pattern', () => {
      const error: ApiError = {
        message: 'Invalid credentials provided',
        status: 401,
      };

      const result = ErrorHandler.getUserFriendlyError(error);

      expect(result.title).toBe('Login Failed');
    });

    it('should detect maintenance pattern', () => {
      const error: ApiError = {
        message: 'System is under maintenance',
        status: 503,
      };

      const result = ErrorHandler.getUserFriendlyError(error);

      expect(result.title).toBe('Maintenance in Progress');
    });
  });

  describe('Technical Message Detection', () => {
    it('should identify technical messages', () => {
      const technicalMessages = [
        'axios request failed',
        'JSON parse error',
        'CORS preflight failed',
        'XMLHttpRequest error',
        'Promise rejected',
        'undefined is not a function',
      ];

      technicalMessages.forEach(message => {
        const error: ApiError = { message };
        const result = ErrorHandler.getUserFriendlyError(error);
        
        expect(result.message).not.toBe(message);
        expect(result.message).toBe('An unexpected error occurred. Please try again or contact support if the problem persists.');
      });
    });

    it('should preserve user-friendly messages', () => {
      const userFriendlyMessages = [
        'Your session has expired',
        'Please check your email and password',
        'This email address is already registered',
        'The file you uploaded is too large',
      ];

      userFriendlyMessages.forEach(message => {
        const error: ApiError = { message };
        const result = ErrorHandler.getUserFriendlyError(error);
        
        expect(result.message).toBe(message);
      });
    });
  });
});