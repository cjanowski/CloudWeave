import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService } from '../apiService';
import { TokenManager } from '../authService';

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

// Mock fetch for integration testing
global.fetch = vi.fn();

describe('ApiService Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful responses by default
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: { success: true },
        status: 'success',
        timestamp: new Date().toISOString(),
      }),
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Network Status', () => {
    it('should detect online status', () => {
      expect(apiService.isOnline()).toBe(true);
    });

    it('should return network status', () => {
      const status = apiService.getNetworkStatus();
      
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('isSlowConnection');
      expect(typeof status.isOnline).toBe('boolean');
      expect(typeof status.isSlowConnection).toBe('boolean');
    });
  });

  describe('Configuration', () => {
    it('should allow setting base URL', () => {
      const newBaseURL = 'https://api.example.com';
      
      expect(() => {
        apiService.setBaseURL(newBaseURL);
      }).not.toThrow();
    });

    it('should allow setting default headers', () => {
      const headers = {
        'X-Custom-Header': 'custom-value',
      };
      
      expect(() => {
        apiService.setDefaultHeaders(headers);
      }).not.toThrow();
    });

    it('should provide access to axios instance', () => {
      const axiosInstance = apiService.getAxiosInstance();
      
      expect(axiosInstance).toBeDefined();
      expect(axiosInstance).toHaveProperty('get');
      expect(axiosInstance).toHaveProperty('post');
      expect(axiosInstance).toHaveProperty('put');
      expect(axiosInstance).toHaveProperty('patch');
      expect(axiosInstance).toHaveProperty('delete');
    });
  });

  describe('Token Management Integration', () => {
    it('should handle requests without token', () => {
      vi.mocked(TokenManager.getToken).mockReturnValue(null);
      
      expect(() => {
        apiService.get('/test');
      }).not.toThrow();
    });

    it('should handle requests with valid token', () => {
      vi.mocked(TokenManager.getToken).mockReturnValue('valid-token');
      vi.mocked(TokenManager.isTokenExpired).mockReturnValue(false);
      
      expect(() => {
        apiService.get('/test');
      }).not.toThrow();
    });

    it('should handle requests with expired token', () => {
      vi.mocked(TokenManager.getToken).mockReturnValue('expired-token');
      vi.mocked(TokenManager.isTokenExpired).mockReturnValue(true);
      
      expect(() => {
        apiService.get('/test');
      }).not.toThrow();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
      
      await expect(apiService.get('/test')).rejects.toThrow();
    });

    it('should handle server errors gracefully', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          message: 'Internal server error',
          status: 'error',
        }),
      } as Response);
      
      await expect(apiService.get('/test')).rejects.toThrow();
    });
  });

  describe('HTTP Methods Integration', () => {
    it('should make GET requests', async () => {
      const mockData = { id: 1, name: 'Test' };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: mockData,
          status: 'success',
          timestamp: new Date().toISOString(),
        }),
      } as Response);

      const result = await apiService.get('/test');
      
      expect(result).toEqual(mockData);
    });

    it('should make POST requests', async () => {
      const mockData = { id: 1, name: 'Created' };
      const requestData = { name: 'Test' };
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          data: mockData,
          status: 'success',
          timestamp: new Date().toISOString(),
        }),
      } as Response);

      const result = await apiService.post('/test', requestData);
      
      expect(result).toEqual(mockData);
    });

    it('should make PUT requests', async () => {
      const mockData = { id: 1, name: 'Updated' };
      const requestData = { name: 'Updated' };
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: mockData,
          status: 'success',
          timestamp: new Date().toISOString(),
        }),
      } as Response);

      const result = await apiService.put('/test/1', requestData);
      
      expect(result).toEqual(mockData);
    });

    it('should make PATCH requests', async () => {
      const mockData = { id: 1, name: 'Patched' };
      const requestData = { name: 'Patched' };
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: mockData,
          status: 'success',
          timestamp: new Date().toISOString(),
        }),
      } as Response);

      const result = await apiService.patch('/test/1', requestData);
      
      expect(result).toEqual(mockData);
    });

    it('should make DELETE requests', async () => {
      const mockData = { success: true };
      
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: mockData,
          status: 'success',
          timestamp: new Date().toISOString(),
        }),
      } as Response);

      const result = await apiService.delete('/test/1');
      
      expect(result).toEqual(mockData);
    });
  });
});