import axios from 'axios';
import { TokenManager } from './authService';

// Axios types (since they're not available in this version)
interface AxiosInstance {
  get: <T = any>(url: string, config?: any) => Promise<AxiosResponse<T>>;
  post: <T = any>(url: string, data?: any, config?: any) => Promise<AxiosResponse<T>>;
  put: <T = any>(url: string, data?: any, config?: any) => Promise<AxiosResponse<T>>;
  patch: <T = any>(url: string, data?: any, config?: any) => Promise<AxiosResponse<T>>;
  delete: <T = any>(url: string, config?: any) => Promise<AxiosResponse<T>>;
  defaults: {
    baseURL: string;
    headers: any;
  };
  interceptors: {
    request: {
      use: (onFulfilled: (config: any) => any, onRejected?: (error: any) => any) => void;
    };
    response: {
      use: (onFulfilled: (response: any) => any, onRejected?: (error: any) => any) => void;
    };
  };
}

interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

interface AxiosError {
  response?: AxiosResponse;
  request?: any;
  message: string;
  code?: string;
  config?: any;
}

interface AxiosRequestConfig {
  headers?: any;
  skipAuth?: boolean;
  retryCount?: number;
  maxRetries?: number;
  _retry?: boolean;
  metadata?: any;
}

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: 'success' | 'error';
  timestamp: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType?: string;
}

// Request configuration interface (already defined above)
export interface ApiRequestConfig extends AxiosRequestConfig {}

// API Service class
export class ApiService {
  private static instance: ApiService;
  private axiosInstance: any;
  private networkStatus: NetworkStatus = { isOnline: true, isSlowConnection: false };
  private refreshTokenPromise: Promise<string> | null = null;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  private constructor() {
    this.axiosInstance = this.createAxiosInstance();
    this.setupInterceptors();
    this.initializeNetworkStatusDetection();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private createAxiosInstance(): any {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    
    return axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: any) => {
        // Add authentication token if not skipped
        if (!config.skipAuth) {
          const token = TokenManager.getToken();
          if (token && !TokenManager.isTokenExpired(token)) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Add request timestamp
        config.metadata = { startTime: Date.now() };

        // Add network status headers
        if (!this.networkStatus.isOnline) {
          throw new Error('No internet connection');
        }

        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Add response time to metadata
        if (response.config.metadata) {
          response.config.metadata.endTime = Date.now();
          response.config.metadata.duration = response.config.metadata.endTime - response.config.metadata.startTime;
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as ApiRequestConfig;

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.skipAuth) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.axiosInstance.request(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.handleAuthenticationFailure();
            return Promise.reject(this.handleError(refreshError));
          }
        }

        // Handle network errors with retry logic
        if (this.shouldRetry(error, originalRequest)) {
          return this.retryRequest(originalRequest);
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshTokenPromise = this.performTokenRefresh(refreshToken);

    try {
      const newToken = await this.refreshTokenPromise;
      return newToken;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<string> {
    try {
      const response = await this.axiosInstance.post('/auth/refresh', 
        { refreshToken },
        { skipAuth: true } as ApiRequestConfig
      );

      const { token, refreshToken: newRefreshToken } = response.data;
      TokenManager.setTokens(token, newRefreshToken);
      
      return token;
    } catch (error) {
      TokenManager.clearTokens();
      throw error;
    }
  }

  private handleAuthenticationFailure(): void {
    TokenManager.clearTokens();
    // Dispatch logout event or redirect to login
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  private shouldRetry(error: AxiosError, config?: ApiRequestConfig): boolean {
    if (!config) return false;

    const retryCount = config.retryCount || 0;
    const maxRetries = config.maxRetries || this.maxRetries;

    // Don't retry if max retries reached
    if (retryCount >= maxRetries) return false;

    // Don't retry authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) return false;

    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private async retryRequest(config: ApiRequestConfig): Promise<AxiosResponse> {
    const retryCount = (config.retryCount || 0) + 1;
    const delay = this.retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff

    await this.sleep(delay);

    config.retryCount = retryCount;
    return this.axiosInstance.request(config);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleError(error: any): ApiError {
    // Network error
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return {
          message: 'Request timeout. Please try again.',
          code: 'TIMEOUT_ERROR',
          status: 408,
        };
      }

      if (error.message === 'No internet connection') {
        return {
          message: 'No internet connection. Please check your network.',
          code: 'NETWORK_ERROR',
          status: 0,
        };
      }

      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        status: 0,
      };
    }

    // Server error
    const { status, data } = error.response;
    
    return {
      message: data?.message || this.getDefaultErrorMessage(status),
      code: data?.code || `HTTP_${status}`,
      status,
      details: data?.details,
    };
  }

  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in.';
      case 403:
        return 'Access denied. You don\'t have permission.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Conflict. Resource already exists.';
      case 422:
        return 'Validation error. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Service temporarily unavailable.';
      case 503:
        return 'Service maintenance. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  }

  private initializeNetworkStatusDetection(): void {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.networkStatus.isOnline = true;
      window.dispatchEvent(new CustomEvent('network:online'));
    });

    window.addEventListener('offline', () => {
      this.networkStatus.isOnline = false;
      window.dispatchEvent(new CustomEvent('network:offline'));
    });

    // Connection speed detection (basic)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConnectionInfo = () => {
        this.networkStatus.connectionType = connection.effectiveType;
        this.networkStatus.isSlowConnection = connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
      };

      connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo();
    }

    // Initial status
    this.networkStatus.isOnline = navigator.onLine;
  }

  // Public API methods
  public async get<T = any>(url: string, config?: ApiRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  public async post<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  public async put<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  public async patch<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  public async delete<T = any>(url: string, config?: ApiRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  // Utility methods
  public getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  public isOnline(): boolean {
    return this.networkStatus.isOnline;
  }

  public setBaseURL(baseURL: string): void {
    this.axiosInstance.defaults.baseURL = baseURL;
  }

  public setDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(this.axiosInstance.defaults.headers, headers);
  }

  // Raw axios instance for advanced usage
  public getAxiosInstance(): any {
    return this.axiosInstance;
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();
export default apiService;