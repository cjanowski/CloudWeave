import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import authSlice, {
  loginAsync,
  registerAsync,
  forgotPasswordAsync,
  logoutAsync,
  getCurrentUserAsync,
  clearError,
  setUser,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
} from '../authSlice';
import { AuthService, TokenManager } from '../../../services/authService';

// Mock the auth service
vi.mock('../../../services/authService', () => ({
  AuthService: {
    login: vi.fn(),
    register: vi.fn(),
    forgotPassword: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
  },
  TokenManager: {
    getToken: vi.fn(),
    getUser: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

const mockedAuthService = AuthService as any;
const mockedTokenManager = TokenManager as any;

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authSlice,
      },
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state structure', () => {
      const state = store.getState().auth;
      expect(state).toHaveProperty('isAuthenticated');
      expect(state).toHaveProperty('user');
      expect(state).toHaveProperty('token');
      expect(state).toHaveProperty('loading');
      expect(state).toHaveProperty('error');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('synchronous actions', () => {
    it('should handle clearError', () => {
      // Set initial error state
      store.dispatch(loginFailure('Test error'));
      expect(store.getState().auth.error).toBe('Test error');

      // Clear error
      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });

    it('should handle setUser', () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' };
      store.dispatch(setUser(user));
      expect(store.getState().auth.user).toEqual(user);
    });

    it('should handle loginStart', () => {
      store.dispatch(loginStart());
      const state = store.getState().auth;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle loginSuccess', () => {
      const payload = {
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
        token: 'test-token',
      };
      store.dispatch(loginSuccess(payload));
      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(payload.user);
      expect(state.token).toBe(payload.token);
      expect(state.error).toBeNull();
    });

    it('should handle loginFailure', () => {
      store.dispatch(loginFailure('Login failed'));
      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.error).toBe('Login failed');
    });

    it('should handle logout', () => {
      // Set authenticated state first
      store.dispatch(loginSuccess({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
        token: 'test-token',
      }));

      // Logout
      store.dispatch(logout());
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.error).toBeNull();
      expect(mockedTokenManager.clearTokens).toHaveBeenCalled();
    });
  });

  describe('async actions', () => {
    describe('loginAsync', () => {
      it('should handle successful login', async () => {
        const mockResponse = {
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
          token: 'test-token',
          refreshToken: 'refresh-token',
        };
        mockedAuthService.login.mockResolvedValue(mockResponse);

        await store.dispatch(loginAsync({
          email: 'test@example.com',
          password: 'password123',
        }));

        const state = store.getState().auth;
        expect(state.loading).toBe(false);
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(mockResponse.user);
        expect(state.token).toBe(mockResponse.token);
        expect(state.error).toBeNull();
      });

      it('should handle login failure', async () => {
        const mockError = { message: 'Invalid credentials' };
        mockedAuthService.login.mockRejectedValue(mockError);

        await store.dispatch(loginAsync({
          email: 'test@example.com',
          password: 'wrong-password',
        }));

        const state = store.getState().auth;
        expect(state.loading).toBe(false);
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
        expect(state.error).toBe('Invalid credentials');
      });
    });

    describe('registerAsync', () => {
      it('should handle successful registration', async () => {
        const mockResponse = {
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
          token: 'test-token',
          refreshToken: 'refresh-token',
        };
        mockedAuthService.register.mockResolvedValue(mockResponse);

        await store.dispatch(registerAsync({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        }));

        const state = store.getState().auth;
        expect(state.loading).toBe(false);
        expect(state.isAuthenticated).toBe(true);
        expect(state.user).toEqual(mockResponse.user);
        expect(state.token).toBe(mockResponse.token);
        expect(state.error).toBeNull();
      });

      it('should handle registration failure', async () => {
        const mockError = { message: 'Email already exists' };
        mockedAuthService.register.mockRejectedValue(mockError);

        await store.dispatch(registerAsync({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        }));

        const state = store.getState().auth;
        expect(state.loading).toBe(false);
        expect(state.isAuthenticated).toBe(false);
        expect(state.error).toBe('Email already exists');
      });
    });

    describe('forgotPasswordAsync', () => {
      it('should handle successful forgot password request', async () => {
        const mockResponse = { message: 'Reset email sent' };
        mockedAuthService.forgotPassword.mockResolvedValue(mockResponse);

        await store.dispatch(forgotPasswordAsync({
          email: 'test@example.com',
        }));

        const state = store.getState().auth;
        expect(state.loading).toBe(false);
        expect(state.error).toBeNull();
      });

      it('should handle forgot password failure', async () => {
        const mockError = { message: 'User not found' };
        mockedAuthService.forgotPassword.mockRejectedValue(mockError);

        await store.dispatch(forgotPasswordAsync({
          email: 'nonexistent@example.com',
        }));

        const state = store.getState().auth;
        expect(state.loading).toBe(false);
        expect(state.error).toBe('User not found');
      });
    });

    describe('logoutAsync', () => {
      it('should handle successful logout', async () => {
        // Set authenticated state first
        store.dispatch(loginSuccess({
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
          token: 'test-token',
        }));

        mockedAuthService.logout.mockResolvedValue();

        await store.dispatch(logoutAsync());

        const state = store.getState().auth;
        expect(state.loading).toBe(false);
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
        expect(state.error).toBeNull();
      });

      it('should handle logout even if API call fails', async () => {
        // Set authenticated state first
        store.dispatch(loginSuccess({
          user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
          token: 'test-token',
        }));

        const mockError = { message: 'Network error' };
        mockedAuthService.logout.mockRejectedValue(mockError);

        await store.dispatch(logoutAsync());

        const state = store.getState().auth;
        expect(state.loading).toBe(false);
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
      });
    });

    describe('getCurrentUserAsync', () => {
      it('should handle successful user fetch', async () => {
        const mockUser = { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' };
        mockedAuthService.getCurrentUser.mockResolvedValue(mockUser);

        await store.dispatch(getCurrentUserAsync());

        const state = store.getState().auth;
        expect(state.loading).toBe(false);
        expect(state.user).toEqual(mockUser);
        expect(state.isAuthenticated).toBe(true);
      });

      it('should handle user fetch failure', async () => {
        mockedAuthService.getCurrentUser.mockResolvedValue(null);

        await store.dispatch(getCurrentUserAsync());

        const state = store.getState().auth;
        expect(state.loading).toBe(false);
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
      });
    });
  });
});