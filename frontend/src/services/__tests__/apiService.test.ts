import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { ApiService, apiService } from '../apiService';
import { TokenManager } from '../authService';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(),
  },
}));
const mockedAxios = vi.mocked(axios);

// Mock TokenManager
vi.mock('../authService', () => ({
  TokenManager: {
    getToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
    isTokenExpired: vi.fn(),
  },
}));

// Mock window events
const mockDispatchEvent = vi.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true,
});

Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
});

describe('ApiService', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      defaults: {
        baseURL: '',
        headers: {},
      },
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    // Reset singleton instance
    (ApiService as any).instance = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ApiService.getInstance();
      const instance2 = ApiService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should create axios instance with correct configuration', () => {
      ApiService.getInstance();
      
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3001/api/v1',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
    });
  });

  describe('HTTP Methods', () => {
    let service: ApiService;

    beforeEach(() => {
      service = ApiService.getInstance();
    });

    it('should make GET request', async () => {
      const mockResponse = {
        data: {
          data: { id: 1, name: 'Test' },
          status: 'success',
          timestamp: '2023-01-01T00:00:00Z',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should make POST request', async () => {
      const mockResponse = {
        data: {
          data: { id: 1, name: 'Created' },
          status: 'success',
          timestamp: '2023-01-01T00:00:00Z',
        },
      };

      const requestData = { name: 'Test' };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await service.post('/test', requestData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', requestData, undefined);
      expect(result).toEqual({ id: 1, name: 'Created' });
    });

    it('should make PUT request', async () => {
      const mockResponse = {
        data: {
          data: { id: 1, name: 'Updated' },
          status: 'success',
          timestamp: '2023-01-01T00:00:00Z',
        },
      };

      const requestData = { name: 'Updated' };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await service.put('/test/1', requestData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', requestData, undefined);
      expect(result).toEqual({ id: 1, name: 'Updated' });
    });

    it('should make PATCH request', async () => {
      const mockResponse = {
        data: {
          data: { id: 1, name: 'Patched' },
          status: 'success',
          timestamp: '2023-01-01T00:00:00Z',
        },
      };

      const requestData = { name: 'Patched' };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await service.patch('/test/1', requestData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', requestData, undefined);
      expect(result).toEqual({ id: 1, name: 'Patched' });
    });

    it('should make DELETE request', async () => {
      const mockResponse = {
        data: {
          data: { success: true },
          status: 'success',
          timestamp: '2023-01-01T00:00:00Z',
        },
      };

      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await service.delete('/test/1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', undefined);
      expect(result).toEqual({ success: true });
    });
  });

  describe('Request Interceptor', () => {
    let requestInterceptor: any;

    beforeEach(() => {
      ApiService.getInstance();
      requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    });

    it('should add authorization header when token exists and is not expired', () => {
      const mockToken = 'valid-token';
      vi.mocked(TokenManager.getToken).mockReturnValue(mockToken);
      vi.mocked(TokenManager.isTokenExpired).mockReturnValue(false);

      const config = {
        headers: {},
        metadata: undefined,
      };

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should not add authorization header when skipAuth is true', () => {
      const mockToken = 'valid-token';
      vi.mocked(TokenManager.getToken).mockReturnValue(mockToken);
      vi.mocked(TokenManager.isTokenExpired).mockReturnValue(false);

      const config = {
        headers: {},
        skipAuth: true,
        metadata: undefined,
      };

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should not add authorization header when token is expired', () => {
      const mockToken = 'expired-token';
      vi.mocked(TokenManager.getToken).mockReturnValue(mockToken);
      vi.mocked(TokenManager.isTokenExpired).mockReturnValue(true);

      const config = {
        headers: {},
        metadata: undefined,
      };

      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should add request timestamp metadata', () => {
      const config = {
        headers: {},
        metadata: undefined,
      };

      const result = requestInterceptor(config);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.startTime).toBeTypeOf('number');
    });

    it('should throw error when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      // Create new instance to pick up offline status
      (ApiService as any).instance = undefined;
      ApiService.getInstance();
      requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];

      const config = {
        headers: {},
        metadata: undefined,
      };

      expect(() => requestInterceptor(config)).toThrow('No internet connection');
    });
  });

  describe('Response Interceptor', () => {
    let responseInterceptor: any;
    let errorInterceptor: any;

    beforeEach(() => {
      ApiService.getInstance();
      const interceptorCall = mockAxiosInstance.interceptors.response.use.mock.calls[0];
      responseInterceptor = interceptorCall[0];
      errorInterceptor = interceptorCall[1];
    });

    it('should add response time metadata', () => {
      const response = {
        config: {
          metadata: {
            startTime: Date.now() - 1000,
          },
        },
      };

      const result = responseInterceptor(response);

      expect(result.config.metadata.endTime).toBeTypeOf('number');
      expect(result.config.metadata.duration).toBeTypeOf('number');
      expect(result.config.metadata.duration).toBeGreaterThan(0);
    });

    it('should handle 401 errors with token refresh', async () => {
      const mockRefreshToken = 'refresh-token';
      const mockNewToken = 'new-token';
      
      vi.mocked(TokenManager.getRefreshToken).mockReturnValue(mockRefreshToken);
      
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          token: mockNewToken,
          refreshToken: 'new-refresh-token',
        },
      });

      const originalRequest = {
        headers: {},
        _retry: undefined,
        skipAuth: false,
      };

      const error = {
        response: { status: 401 },
        config: originalRequest,
      };

      mockAxiosInstance.mockResolvedValue({ data: 'retry-success' });

      const result = await errorInterceptor(error);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/auth/refresh',
        { refreshToken: mockRefreshToken },
        { skipAuth: true }
      );
      expect(TokenManager.setTokens).toHaveBeenCalledWith(mockNewToken, 'new-refresh-token');
      expect(originalRequest.headers.Authorization).toBe(`Bearer ${mockNewToken}`);
      expect(originalRequest._retry).toBe(true);
    });

    it('should handle refresh token failure', async () => {
      vi.mocked(TokenManager.getRefreshToken).mockReturnValue('invalid-refresh-token');
      
      mockAxiosInstance.post.mockRejectedValue(new Error('Refresh failed'));

      const originalRequest = {
        headers: {},
        _retry: undefined,
        skipAuth: false,
      };

      const error = {
        response: { status: 401 },
        config: originalRequest,
      };

      await expect(errorInterceptor(error)).rejects.toThrow();
      
      expect(TokenManager.clearTokens).toHaveBeenCalled();
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:logout',
        })
      );
    });

    it('should retry network errors', async () => {
      const originalRequest = {
        retryCount: 0,
        maxRetries: 3,
      };

      const error = {
        response: undefined, // Network error
        config: originalRequest,
      };

      // Mock the retry
      mockAxiosInstance.mockResolvedValue({ data: 'retry-success' });

      const result = await errorInterceptor(error);

      expect(originalRequest.retryCount).toBe(1);
      expect(result).toEqual({ data: 'retry-success' });
    });

    it('should not retry after max retries', async () => {
      const originalRequest = {
        retryCount: 3,
        maxRetries: 3,
      };

      const error = {
        response: undefined, // Network error
        config: originalRequest,
      };

      await expect(errorInterceptor(error)).rejects.toThrow();
    });
  });

  describe('Network Status Detection', () => {
    it('should detect online status', () => {
      const service = ApiService.getInstance();
      
      expect(service.isOnline()).toBe(true);
    });

    it('should handle online event', () => {
      ApiService.getInstance();
      
      // Simulate going online
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'network:online',
        })
      );
    });

    it('should handle offline event', () => {
      ApiService.getInstance();
      
      // Simulate going offline
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'network:offline',
        })
      );
    });
  });

  describe('Utility Methods', () => {
    let service: ApiService;

    beforeEach(() => {
      service = ApiService.getInstance();
    });

    it('should get network status', () => {
      const status = service.getNetworkStatus();
      
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('isSlowConnection');
    });

    it('should set base URL', () => {
      const newBaseURL = 'https://api.example.com';
      
      service.setBaseURL(newBaseURL);
      
      expect(mockAxiosInstance.defaults.baseURL).toBe(newBaseURL);
    });

    it('should set default headers', () => {
      const headers = {
        'X-Custom-Header': 'custom-value',
        'X-Another-Header': 'another-value',
      };
      
      service.setDefaultHeaders(headers);
      
      expect(mockAxiosInstance.defaults.headers).toEqual(
        expect.objectContaining(headers)
      );
    });

    it('should return axios instance', () => {
      const axiosInstance = service.getAxiosInstance();
      
      expect(axiosInstance).toBe(mockAxiosInstance);
    });
  });

  describe('Error Handling', () => {
    let service: ApiService;

    beforeEach(() => {
      service = ApiService.getInstance();
    });

    it('should handle network errors', async () => {
      const networkError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      };

      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(service.get('/test')).rejects.toMatchObject({
        message: 'Request timeout. Please try again.',
        code: 'TIMEOUT_ERROR',
        status: 408,
      });
    });

    it('should handle server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
            code: 'SERVER_ERROR',
          },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(serverError);

      await expect(service.get('/test')).rejects.toMatchObject({
        message: 'Internal server error',
        code: 'SERVER_ERROR',
        status: 500,
      });
    });

    it('should handle validation errors', async () => {
      const validationError = {
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: {
              email: ['Email is required'],
              password: ['Password is too short'],
            },
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(validationError);

      await expect(service.post('/test', {})).rejects.toMatchObject({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        status: 422,
        details: {
          email: ['Email is required'],
          password: ['Password is too short'],
        },
      });
    });
  });
});