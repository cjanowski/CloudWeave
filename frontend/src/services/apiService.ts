import axios from 'axios';
import { TokenManager } from './authService';

// API Error interface
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// Simple API service that works with the current axios version
export class ApiService {
  private static instance: ApiService;
  private axiosInstance: any;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
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
        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        const originalRequest = error.config;

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.skipAuth) {
          originalRequest._retry = true;

          try {
            const refreshToken = TokenManager.getRefreshToken();
            if (refreshToken) {
              const response = await this.axiosInstance.post('/auth/refresh', 
                { refreshToken },
                { skipAuth: true }
              );

              const { token, refreshToken: newRefreshToken } = response.data;
              TokenManager.setTokens(token, newRefreshToken);
              
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.axiosInstance.request(originalRequest);
            }
          } catch (refreshError) {
            TokenManager.clearTokens();
            window.dispatchEvent(new CustomEvent('auth:logout'));
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // HTTP Methods
  public async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.axiosInstance.get(url, config);
    return response.data.data || response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.axiosInstance.post(url, data, config);
    return response.data.data || response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.axiosInstance.put(url, data, config);
    return response.data.data || response.data;
  }

  public async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.axiosInstance.patch(url, data, config);
    return response.data.data || response.data;
  }

  public async delete<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.axiosInstance.delete(url, config);
    return response.data.data || response.data;
  }

  // Utility methods
  public isOnline(): boolean {
    return navigator.onLine;
  }

  public setBaseURL(baseURL: string): void {
    this.axiosInstance.defaults.baseURL = baseURL;
  }

  public setDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(this.axiosInstance.defaults.headers, headers);
  }

  public getAxiosInstance(): any {
    return this.axiosInstance;
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();
export default apiService;