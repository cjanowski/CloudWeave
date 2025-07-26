import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import { AuthService, TokenManager } from '../authService';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('TokenManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('setTokens', () => {
    it('should store token in localStorage', () => {
      TokenManager.setTokens('test-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test-token');
    });

    it('should store both token and refresh token', () => {
      TokenManager.setTokens('test-token', 'refresh-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
    });
  });

  describe('getToken', () => {
    it('should retrieve token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('stored-token');
      const token = TokenManager.getToken();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token');
      expect(token).toBe('stored-token');
    });

    it('should return null if no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const token = TokenManager.getToken();
      expect(token).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should store user data as JSON string', () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' };
      TokenManager.setUser(user);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user_data', JSON.stringify(user));
    });
  });

  describe('getUser', () => {
    it('should retrieve and parse user data', () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(user));
      const retrievedUser = TokenManager.getUser();
      expect(retrievedUser).toEqual(user);
    });

    it('should return null if no user data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const user = TokenManager.getUser();
      expect(user).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should remove all auth-related items from localStorage', () => {
      TokenManager.clearTokens();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_data');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      // Create a token that expires in the future
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = { exp: futureTime };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      expect(TokenManager.isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      // Create a token that expired in the past
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = { exp: pastTime };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      expect(TokenManager.isTokenExpired(token)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(TokenManager.isTokenExpired('invalid-token')).toBe(true);
    });
  });
});

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      const mockResponse = {
        data: {
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
          token: 'jwt-token',
          refreshToken: 'refresh-token',
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);
      vi.spyOn(TokenManager, 'setTokens');
      vi.spyOn(TokenManager, 'setUser');

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(TokenManager.setTokens).toHaveBeenCalledWith('jwt-token', 'refresh-token');
      expect(TokenManager.setUser).toHaveBeenCalledWith(mockResponse.data.user);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle login error', async () => {
      const mockError = {
        response: {
          data: { message: 'Invalid credentials' },
          status: 401,
        },
      };

      mockedAxios.post.mockRejectedValue(mockError);

      await expect(AuthService.login({
        email: 'test@example.com',
        password: 'wrong-password',
      })).rejects.toEqual({
        message: 'Invalid credentials',
        status: 401,
      });
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockResponse = {
        data: {
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
          token: 'jwt-token',
          refreshToken: 'refresh-token',
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);
      vi.spyOn(TokenManager, 'setTokens');
      vi.spyOn(TokenManager, 'setUser');

      const result = await AuthService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error if passwords do not match', async () => {
      await expect(AuthService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different-password',
      })).rejects.toThrow('Passwords do not match');
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password request', async () => {
      const mockResponse = {
        data: { message: 'Reset email sent' },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await AuthService.forgotPassword({
        email: 'test@example.com',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@example.com',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('logout', () => {
    it('should logout and clear tokens', async () => {
      mockedAxios.post.mockResolvedValue({});
      vi.spyOn(TokenManager, 'clearTokens');

      await AuthService.logout();

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/logout');
      expect(TokenManager.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens even if API call fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));
      vi.spyOn(TokenManager, 'clearTokens');
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      await AuthService.logout();

      expect(TokenManager.clearTokens).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true for valid token', () => {
      vi.spyOn(TokenManager, 'getToken').mockReturnValue('valid-token');
      vi.spyOn(TokenManager, 'isTokenExpired').mockReturnValue(false);

      expect(AuthService.isAuthenticated()).toBe(true);
    });

    it('should return false for expired token', () => {
      vi.spyOn(TokenManager, 'getToken').mockReturnValue('expired-token');
      vi.spyOn(TokenManager, 'isTokenExpired').mockReturnValue(true);

      expect(AuthService.isAuthenticated()).toBe(false);
    });

    it('should return false for no token', () => {
      vi.spyOn(TokenManager, 'getToken').mockReturnValue(null);

      expect(AuthService.isAuthenticated()).toBe(false);
    });
  });
});