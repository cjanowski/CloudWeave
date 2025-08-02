import { apiService } from './apiService';
import { ErrorHandler } from './errorHandler';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User
} from '../types/api';

// Re-export types for backward compatibility
export interface LoginCredentials extends LoginRequest {}
export interface RegisterCredentials extends RegisterRequest {
  confirmPassword: string;
}
export interface AuthResponse extends LoginResponse {}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Token management utilities
export class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user_data';

  static setTokens(token: string, refreshToken?: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData || userData === 'undefined' || userData === 'null') {
      return null;
    }
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.warn('Failed to parse user data from localStorage:', error);
      localStorage.removeItem(this.USER_KEY);
      return null;
    }
  }

  static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}

// Authentication service class
export class AuthService {

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiService.post<LoginResponse>('/auth/login', credentials, { skipAuth: true });
      
      const { user, token, refreshToken } = response;
      
      // Store tokens and user data
      TokenManager.setTokens(token, refreshToken);
      TokenManager.setUser(user);
      
      return response;
    } catch (error: any) {
      ErrorHandler.logError(error, 'AuthService.login');
      throw this.handleError(error);
    }
  }

  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      // Validate passwords match
      if (credentials.password !== credentials.confirmPassword) {
        throw {
          message: 'Passwords do not match',
          code: 'PASSWORDS_MISMATCH',
          status: 400
        };
      }

      const registerData: RegisterRequest = {
        email: credentials.email,
        password: credentials.password,
        name: credentials.name,
        companyName: credentials.companyName,
      };

      const response = await apiService.post<RegisterResponse>('/auth/register', registerData, { skipAuth: true });
      
      const { user, token, refreshToken } = response;
      
      // Store tokens and user data
      TokenManager.setTokens(token, refreshToken);
      TokenManager.setUser(user);
      
      return response;
    } catch (error: any) {
      ErrorHandler.logError(error, 'AuthService.register');
      throw this.handleError(error);
    }
  }

  static async forgotPassword(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    try {
      const response = await apiService.post<ForgotPasswordResponse>('/auth/forgot-password', request, { skipAuth: true });
      return response;
    } catch (error: any) {
      ErrorHandler.logError(error, 'AuthService.forgotPassword');
      throw this.handleError(error);
    }
  }

  static async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const request: RefreshTokenRequest = { refreshToken };
      const response = await apiService.post<RefreshTokenResponse>('/auth/refresh', request, { skipAuth: true });
      return response;
    } catch (error: any) {
      ErrorHandler.logError(error, 'AuthService.refreshToken');
      throw this.handleError(error);
    }
  }

  static async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
      ErrorHandler.logError(error as any, 'AuthService.logout');
    } finally {
      TokenManager.clearTokens();
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const token = TokenManager.getToken();
      if (!token || TokenManager.isTokenExpired(token)) {
        return null;
      }

      const response = await apiService.get<{ user: User }>('/auth/me');
      
      const user = response.user;
      TokenManager.setUser(user);
      
      return user;
    } catch (error) {
      ErrorHandler.logError(error as any, 'AuthService.getCurrentUser');
      TokenManager.clearTokens();
      return null;
    }
  }

  static async getUserProfile(): Promise<User | null> {
    try {
      const token = TokenManager.getToken();
      if (!token || TokenManager.isTokenExpired(token)) {
        return null;
      }

      const response = await apiService.get<{ user: User }>('/user/profile');
      
      const user = response.user;
      TokenManager.setUser(user);
      
      return user;
    } catch (error) {
      ErrorHandler.logError(error as any, 'AuthService.getUserProfile');
      return null;
    }
  }

  static isAuthenticated(): boolean {
    const token = TokenManager.getToken();
    return token !== null && !TokenManager.isTokenExpired(token);
  }

  // SSO Methods
  static async getSSOConfig(): Promise<any> {
    try {
      const response = await apiService.get('/auth/sso/config');
      return response;
    } catch (error: any) {
      ErrorHandler.logError(error, 'AuthService.getSSOConfig');
      throw this.handleError(error);
    }
  }

  static async initiateOAuthLogin(provider: string, state?: string): Promise<{ authUrl: string }> {
    try {
      const response = await apiService.post('/auth/sso/oauth/login', {
        provider,
        state,
      }, { skipAuth: true });
      return response;
    } catch (error: any) {
      ErrorHandler.logError(error, 'AuthService.initiateOAuthLogin');
      throw this.handleError(error);
    }
  }

  static async handleOAuthCallback(provider: string, code: string, state?: string, organizationId?: string): Promise<AuthResponse> {
    try {
      const params = organizationId ? `?organizationId=${organizationId}` : '';
      const response = await apiService.post<LoginResponse>(`/auth/sso/oauth/callback${params}`, {
        provider,
        code,
        state,
      }, { skipAuth: true });
      
      const { user, token, refreshToken } = response;
      
      // Store tokens and user data
      TokenManager.setTokens(token, refreshToken);
      TokenManager.setUser(user);
      
      return response;
    } catch (error: any) {
      ErrorHandler.logError(error, 'AuthService.handleOAuthCallback');
      throw this.handleError(error);
    }
  }

  private static handleError(error: any): ApiError {
    // If it's already a properly formatted error, return it
    if (error.message && (error.code || error.status)) {
      return error;
    }

    // Use the ErrorHandler to get user-friendly error
    const userFriendlyError = ErrorHandler.getUserFriendlyError(error);
    
    return {
      message: userFriendlyError.message,
      code: error.code || 'UNKNOWN_ERROR',
      status: error.status,
    };
  }
}

export default AuthService;