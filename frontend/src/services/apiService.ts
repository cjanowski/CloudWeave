import axios from 'axios';
import { TokenManager } from './authService';
import { demoDataService } from './demoDataService';

// API Error interface
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  requestId?: string;
  timestamp?: string;
}

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  requestId?: string;
  timestamp?: string;
}

// Loading state interface
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated?: string;
}

// Enhanced API service with demo data fallback and real-time updates
export class ApiService {
  private static instance: ApiService;
  private axiosInstance: any;
  private loadingStates: Map<string, LoadingState> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
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

  // Loading state management
  public setLoadingState(key: string, state: Partial<LoadingState>): void {
    const currentState = this.loadingStates.get(key) || { isLoading: false, error: null };
    this.loadingStates.set(key, { ...currentState, ...state });
    this.emit(`loading:${key}`, this.loadingStates.get(key));
  }

  public getLoadingState(key: string): LoadingState {
    return this.loadingStates.get(key) || { isLoading: false, error: null };
  }

  // Event listener management for real-time updates
  public subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Check if user is in demo mode
  private isDemoMode(): boolean {
    // Get demo state from Redux store if available
    const state = (window as any).__REDUX_STORE__?.getState?.();
    const isDemo = state?.demo?.isDemo || false;

    // Also check if user is not authenticated - treat as demo mode
    const isAuthenticated = state?.auth?.isAuthenticated || false;
    const hasValidToken = TokenManager.getToken() && !TokenManager.isTokenExpired(TokenManager.getToken()!);

    return isDemo || !isAuthenticated || !hasValidToken;
  }

  // Get demo scenario
  private getDemoScenario(): string {
    const state = (window as any).__REDUX_STORE__?.getState?.();
    return state?.demo?.scenario || 'startup';
  }

  // Enhanced HTTP Methods with demo fallback
  public async get<T = any>(url: string, config?: any): Promise<T> {
    const loadingKey = `get:${url}`;
    this.setLoadingState(loadingKey, { isLoading: true, error: null });

    try {
      const response = await this.axiosInstance.get(url, config);
      const data = response?.data?.data || response?.data || null;
      
      this.setLoadingState(loadingKey, { 
        isLoading: false, 
        error: null, 
        lastUpdated: new Date().toISOString() 
      });
      
      return data;
    } catch (error: any) {
      console.warn(`API call failed for ${url}, attempting demo data fallback:`, error.message);
      
      // Try demo data fallback if in demo mode or API is unavailable
      if (this.isDemoMode() || this.isNetworkError(error)) {
        try {
          const demoData = await this.getDemoDataFallback<T>(url);
          this.setLoadingState(loadingKey, { 
            isLoading: false, 
            error: null, 
            lastUpdated: new Date().toISOString() 
          });
          return demoData;
        } catch (demoError) {
          console.error('Demo data fallback failed:', demoError);
        }
      }

      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'Request failed',
        code: error.response?.data?.code || error.code,
        status: error.response?.status,
        details: error.response?.data?.details,
        requestId: error.response?.headers?.['x-request-id'],
        timestamp: new Date().toISOString(),
      };

      this.setLoadingState(loadingKey, { 
        isLoading: false, 
        error: apiError.message 
      });

      throw apiError;
    }
  }

  public async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const loadingKey = `post:${url}`;
    this.setLoadingState(loadingKey, { isLoading: true, error: null });

    try {
      const response = await this.axiosInstance.post(url, data, config);
      const responseData = response?.data?.data || response?.data || null;
      
      this.setLoadingState(loadingKey, { 
        isLoading: false, 
        error: null, 
        lastUpdated: new Date().toISOString() 
      });
      
      return responseData;
    } catch (error: any) {
      console.warn(`API POST failed for ${url}, attempting demo data fallback:`, error.message);
      
      // Try demo data fallback for create operations
      if (this.isDemoMode() || this.isNetworkError(error)) {
        try {
          const demoData = await this.createDemoDataFallback<T>(url, data);
          this.setLoadingState(loadingKey, { 
            isLoading: false, 
            error: null, 
            lastUpdated: new Date().toISOString() 
          });
          return demoData;
        } catch (demoError) {
          console.error('Demo data creation fallback failed:', demoError);
        }
      }

      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'Request failed',
        code: error.response?.data?.code || error.code,
        status: error.response?.status,
        details: error.response?.data?.details,
        requestId: error.response?.headers?.['x-request-id'],
        timestamp: new Date().toISOString(),
      };

      this.setLoadingState(loadingKey, { 
        isLoading: false, 
        error: apiError.message 
      });

      throw apiError;
    }
  }

  public async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const loadingKey = `put:${url}`;
    this.setLoadingState(loadingKey, { isLoading: true, error: null });

    try {
      const response = await this.axiosInstance.put(url, data, config);
      const responseData = response?.data?.data || response?.data || null;
      
      this.setLoadingState(loadingKey, { 
        isLoading: false, 
        error: null, 
        lastUpdated: new Date().toISOString() 
      });
      
      return responseData;
    } catch (error: any) {
      console.warn(`API PUT failed for ${url}, attempting demo data fallback:`, error.message);
      
      if (this.isDemoMode() || this.isNetworkError(error)) {
        try {
          const demoData = await this.updateDemoDataFallback<T>(url, data);
          this.setLoadingState(loadingKey, { 
            isLoading: false, 
            error: null, 
            lastUpdated: new Date().toISOString() 
          });
          return demoData;
        } catch (demoError) {
          console.error('Demo data update fallback failed:', demoError);
        }
      }

      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'Request failed',
        code: error.response?.data?.code || error.code,
        status: error.response?.status,
        details: error.response?.data?.details,
        requestId: error.response?.headers?.['x-request-id'],
        timestamp: new Date().toISOString(),
      };

      this.setLoadingState(loadingKey, { 
        isLoading: false, 
        error: apiError.message 
      });

      throw apiError;
    }
  }

  public async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const loadingKey = `patch:${url}`;
    this.setLoadingState(loadingKey, { isLoading: true, error: null });

    try {
      const response = await this.axiosInstance.patch(url, data, config);
      const responseData = response?.data?.data || response?.data || null;
      
      this.setLoadingState(loadingKey, { 
        isLoading: false, 
        error: null, 
        lastUpdated: new Date().toISOString() 
      });
      
      return responseData;
    } catch (error: any) {
      console.warn(`API PATCH failed for ${url}, attempting demo data fallback:`, error.message);
      
      if (this.isDemoMode() || this.isNetworkError(error)) {
        try {
          const demoData = await this.updateDemoDataFallback<T>(url, data);
          this.setLoadingState(loadingKey, { 
            isLoading: false, 
            error: null, 
            lastUpdated: new Date().toISOString() 
          });
          return demoData;
        } catch (demoError) {
          console.error('Demo data patch fallback failed:', demoError);
        }
      }

      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'Request failed',
        code: error.response?.data?.code || error.code,
        status: error.response?.status,
        details: error.response?.data?.details,
        requestId: error.response?.headers?.['x-request-id'],
        timestamp: new Date().toISOString(),
      };

      this.setLoadingState(loadingKey, { 
        isLoading: false, 
        error: apiError.message 
      });

      throw apiError;
    }
  }

  public async delete<T = any>(url: string, config?: any): Promise<T> {
    const loadingKey = `delete:${url}`;
    this.setLoadingState(loadingKey, { isLoading: true, error: null });

    try {
      const response = await this.axiosInstance.delete(url, config);
      const responseData = response?.data?.data || response?.data || null;
      
      this.setLoadingState(loadingKey, { 
        isLoading: false, 
        error: null, 
        lastUpdated: new Date().toISOString() 
      });
      
      return responseData;
    } catch (error: any) {
      console.warn(`API DELETE failed for ${url}, attempting demo data fallback:`, error.message);
      
      if (this.isDemoMode() || this.isNetworkError(error)) {
        try {
          const demoData = await this.deleteDemoDataFallback<T>(url);
          this.setLoadingState(loadingKey, { 
            isLoading: false, 
            error: null, 
            lastUpdated: new Date().toISOString() 
          });
          return demoData;
        } catch (demoError) {
          console.error('Demo data delete fallback failed:', demoError);
        }
      }

      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'Request failed',
        code: error.response?.data?.code || error.code,
        status: error.response?.status,
        details: error.response?.data?.details,
        requestId: error.response?.headers?.['x-request-id'],
        timestamp: new Date().toISOString(),
      };

      this.setLoadingState(loadingKey, { 
        isLoading: false, 
        error: apiError.message 
      });

      throw apiError;
    }
  }

  // Demo data fallback methods
  private async getDemoDataFallback<T>(url: string): Promise<T> {
    const scenario = this.getDemoScenario();
    
    // Map API endpoints to demo data types
    if (url.includes('/infrastructure')) {
      if (url.includes('/stats')) {
        return demoDataService.generateLocalDemoData('infrastructure-stats', scenario) as T;
      }
      if (url.includes('/distribution')) {
        return demoDataService.generateLocalDemoData('infrastructure-distribution', scenario) as T;
      }
      if (url.includes('/recent-changes')) {
        return demoDataService.generateLocalDemoData('infrastructure-changes', scenario) as T;
      }
      return demoDataService.generateLocalDemoData('infrastructure', scenario) as T;
    }
    
    if (url.includes('/deployments')) {
      if (url.includes('/stats')) {
        return demoDataService.generateLocalDemoData('deployment-stats', scenario) as T;
      }
      if (url.includes('/environments')) {
        return demoDataService.generateLocalDemoData('deployment-environments', scenario) as T;
      }
      return demoDataService.generateLocalDemoData('deployments', scenario) as T;
    }
    
    if (url.includes('/dashboard')) {
      if (url.includes('/stats')) {
        return demoDataService.generateLocalDemoData('dashboard-stats', scenario) as T;
      }
      if (url.includes('/activity')) {
        return demoDataService.generateLocalDemoData('dashboard-activity', scenario) as T;
      }
      if (url.includes('/performance')) {
        return demoDataService.generateLocalDemoData('dashboard-performance', scenario) as T;
      }
      if (url.includes('/costs')) {
        return demoDataService.generateLocalDemoData('dashboard-costs', scenario) as T;
      }
      if (url.includes('/security')) {
        return demoDataService.generateLocalDemoData('dashboard-security', scenario) as T;
      }
    }
    
    if (url.includes('/metrics')) {
      return demoDataService.generateLocalDemoData('metrics', scenario) as T;
    }
    
    if (url.includes('/alerts')) {
      return demoDataService.generateLocalDemoData('alerts', scenario) as T;
    }
    
    if (url.includes('/cost')) {
      return demoDataService.generateLocalDemoData('cost', scenario) as T;
    }
    
    // Default fallback
    return {} as T;
  }

  private async createDemoDataFallback<T>(url: string, data: any): Promise<T> {
    const scenario = this.getDemoScenario();
    
    // Simulate creation by returning a mock object with the provided data
    const mockCreatedItem = {
      id: `demo-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      demoMetadata: {
        isDemo: true,
        scenario,
        realistic: true,
        tags: ['demo', 'created'],
        description: `Demo ${url.split('/').pop()} created via fallback`
      }
    };
    
    return mockCreatedItem as T;
  }

  private async updateDemoDataFallback<T>(url: string, data: any): Promise<T> {
    const scenario = this.getDemoScenario();
    
    // Simulate update by returning a mock object with the provided data
    const mockUpdatedItem = {
      id: url.split('/').pop() || `demo-${Date.now()}`,
      ...data,
      updatedAt: new Date().toISOString(),
      demoMetadata: {
        isDemo: true,
        scenario,
        realistic: true,
        tags: ['demo', 'updated'],
        description: `Demo ${url.split('/').pop()} updated via fallback`
      }
    };
    
    return mockUpdatedItem as T;
  }

  private async deleteDemoDataFallback<T>(url: string): Promise<T> {
    // Simulate successful deletion
    console.log(`Demo data deleted for ${url}`);
    return { success: true, message: 'Demo data deleted successfully' } as T;
  }

  // Check if error is network-related or authentication-related
  private isNetworkError(error: any): boolean {
    return !error.response ||
           error.code === 'NETWORK_ERROR' ||
           error.code === 'ECONNREFUSED' ||
           error.code === 'TIMEOUT' ||
           (error.response && error.response.status >= 500) ||
           (error.response && (error.response.status === 401 || error.response.status === 403));
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