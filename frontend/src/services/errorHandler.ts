import type { ApiError } from './apiService';

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  severity: 'error' | 'warning' | 'info';
  retryable: boolean;
}

export class ErrorHandler {
  private static errorMessages: Record<string, UserFriendlyError> = {
    // Network errors
    NETWORK_ERROR: {
      title: 'Connection Problem',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      action: 'Retry',
      severity: 'error',
      retryable: true,
    },
    TIMEOUT_ERROR: {
      title: 'Request Timeout',
      message: 'The request took too long to complete. This might be due to a slow connection.',
      action: 'Try Again',
      severity: 'warning',
      retryable: true,
    },

    // Authentication errors
    INVALID_CREDENTIALS: {
      title: 'Login Failed',
      message: 'The email or password you entered is incorrect. Please try again.',
      action: 'Try Again',
      severity: 'error',
      retryable: false,
    },
    TOKEN_EXPIRED: {
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again to continue.',
      action: 'Log In',
      severity: 'warning',
      retryable: false,
    },
    UNAUTHORIZED: {
      title: 'Access Denied',
      message: 'You don\'t have permission to access this resource.',
      severity: 'error',
      retryable: false,
    },

    // Validation errors
    VALIDATION_ERROR: {
      title: 'Invalid Input',
      message: 'Please check your input and try again.',
      severity: 'error',
      retryable: false,
    },
    EMAIL_ALREADY_EXISTS: {
      title: 'Email Already Registered',
      message: 'An account with this email address already exists. Try logging in instead.',
      action: 'Log In',
      severity: 'error',
      retryable: false,
    },
    WEAK_PASSWORD: {
      title: 'Password Too Weak',
      message: 'Your password must be at least 8 characters long and contain uppercase, lowercase, and numbers.',
      severity: 'error',
      retryable: false,
    },

    // Server errors
    SERVER_ERROR: {
      title: 'Server Error',
      message: 'Something went wrong on our end. Our team has been notified and is working on a fix.',
      action: 'Try Again Later',
      severity: 'error',
      retryable: true,
    },
    SERVICE_UNAVAILABLE: {
      title: 'Service Unavailable',
      message: 'The service is temporarily unavailable. Please try again in a few minutes.',
      action: 'Try Again Later',
      severity: 'warning',
      retryable: true,
    },
    MAINTENANCE_MODE: {
      title: 'Maintenance in Progress',
      message: 'The service is currently under maintenance. Please check back later.',
      severity: 'info',
      retryable: true,
    },

    // Rate limiting
    RATE_LIMIT_EXCEEDED: {
      title: 'Too Many Requests',
      message: 'You\'ve made too many requests. Please wait a moment before trying again.',
      action: 'Wait and Retry',
      severity: 'warning',
      retryable: true,
    },

    // Resource errors
    NOT_FOUND: {
      title: 'Not Found',
      message: 'The requested resource could not be found.',
      severity: 'error',
      retryable: false,
    },
    RESOURCE_CONFLICT: {
      title: 'Resource Conflict',
      message: 'The resource you\'re trying to create already exists or conflicts with existing data.',
      severity: 'error',
      retryable: false,
    },

    // Default fallback
    UNKNOWN_ERROR: {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      action: 'Try Again',
      severity: 'error',
      retryable: true,
    },
  };

  public static getUserFriendlyError(error: ApiError): UserFriendlyError {
    // Try to find specific error by code
    if (error.code && this.errorMessages[error.code]) {
      return this.errorMessages[error.code];
    }

    // Check for specific error patterns in message first (higher priority than status)
    const patternError = this.getErrorByMessagePattern(error.message);
    if (patternError) {
      return patternError;
    }

    // Try to find error by HTTP status
    const statusError = this.getErrorByStatus(error.status);
    if (statusError) {
      return statusError;
    }

    // Return default error with original message if it's user-friendly
    return {
      title: 'Error',
      message: this.isUserFriendlyMessage(error.message) ? error.message : this.errorMessages.UNKNOWN_ERROR.message,
      severity: 'error',
      retryable: false,
    };
  }

  private static getErrorByStatus(status?: number): UserFriendlyError | null {
    if (!status) return null;

    switch (status) {
      case 400:
        return this.errorMessages.VALIDATION_ERROR;
      case 401:
        return this.errorMessages.TOKEN_EXPIRED;
      case 403:
        return this.errorMessages.UNAUTHORIZED;
      case 404:
        return this.errorMessages.NOT_FOUND;
      case 409:
        return this.errorMessages.RESOURCE_CONFLICT;
      case 422:
        return this.errorMessages.VALIDATION_ERROR;
      case 429:
        return this.errorMessages.RATE_LIMIT_EXCEEDED;
      case 500:
      case 502:
      case 504:
        return this.errorMessages.SERVER_ERROR;
      case 503:
        return this.errorMessages.SERVICE_UNAVAILABLE;
      default:
        return null;
    }
  }

  private static getErrorByMessagePattern(message: string): UserFriendlyError | null {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('password') && lowerMessage.includes('weak')) {
      return this.errorMessages.WEAK_PASSWORD;
    }

    if (lowerMessage.includes('email') && lowerMessage.includes('exists')) {
      return this.errorMessages.EMAIL_ALREADY_EXISTS;
    }

    if (lowerMessage.includes('invalid') && lowerMessage.includes('credentials')) {
      return this.errorMessages.INVALID_CREDENTIALS;
    }

    if (lowerMessage.includes('maintenance')) {
      return this.errorMessages.MAINTENANCE_MODE;
    }

    return null;
  }

  private static isUserFriendlyMessage(message: string): boolean {
    // Check if message contains technical jargon that users shouldn't see
    const technicalTerms = [
      'axios',
      'xhr',
      'cors',
      'preflight',
      'socket',
      'tcp',
      'ssl',
      'tls',
      'dns',
      'http',
      'json',
      'parse',
      'stringify',
      'undefined',
      'null',
      'object',
      'array',
      'function',
      'promise',
      'async',
      'await',
      'callback',
    ];

    const lowerMessage = message.toLowerCase();
    return !technicalTerms.some(term => lowerMessage.includes(term));
  }

  public static formatValidationErrors(errors: Record<string, string[]>): string {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        return `${fieldName}: ${messages.join(', ')}`;
      })
      .join('\n');

    return errorMessages || 'Please check your input and try again.';
  }

  public static shouldShowRetryButton(error: UserFriendlyError): boolean {
    return error.retryable && error.severity !== 'info';
  }

  public static getRetryDelay(attemptCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
    
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.max(delay + jitter, 1000);
  }

  public static logError(error: ApiError, context?: string): void {
    const logData = {
      timestamp: new Date().toISOString(),
      context,
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // In development, log to console
    if (import.meta.env?.DEV) {
      console.error('API Error:', logData);
    }

    // In production, you might want to send to error tracking service
    // Example: Sentry, LogRocket, etc.
    if (import.meta.env?.PROD) {
      // sendToErrorTrackingService(logData);
    }
  }
}

export default ErrorHandler;