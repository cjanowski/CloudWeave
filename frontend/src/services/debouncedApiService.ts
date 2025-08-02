import { apiService } from './apiService';

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

class DebouncedApiService {
  private pendingRequests: Map<string, PendingRequest[]> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private requestCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  // Default debounce delay in milliseconds
  private readonly DEFAULT_DEBOUNCE_DELAY = 100;
  
  // Default cache TTL in milliseconds
  private readonly DEFAULT_CACHE_TTL = 30000; // 30 seconds

  /**
   * Debounced GET request that batches multiple identical requests
   */
  async get<T = any>(
    url: string, 
    config?: any, 
    debounceDelay: number = this.DEFAULT_DEBOUNCE_DELAY,
    cacheTTL: number = this.DEFAULT_CACHE_TTL
  ): Promise<T> {
    const cacheKey = this.getCacheKey(url, config);
    
    // Check cache first
    const cached = this.getFromCache<T>(cacheKey);
    if (cached) {
      return cached;
    }

    return new Promise<T>((resolve, reject) => {
      // Add this request to pending requests
      if (!this.pendingRequests.has(cacheKey)) {
        this.pendingRequests.set(cacheKey, []);
      }
      
      this.pendingRequests.get(cacheKey)!.push({
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Clear existing timer if any
      if (this.debounceTimers.has(cacheKey)) {
        clearTimeout(this.debounceTimers.get(cacheKey)!);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        const requests = this.pendingRequests.get(cacheKey) || [];
        this.pendingRequests.delete(cacheKey);
        this.debounceTimers.delete(cacheKey);

        if (requests.length === 0) return;

        try {
          const result = await apiService.get<T>(url, config);
          
          // Cache the result
          this.setCache(cacheKey, result, cacheTTL);
          
          // Resolve all pending requests
          requests.forEach(request => request.resolve(result));
        } catch (error) {
          // Reject all pending requests
          requests.forEach(request => request.reject(error));
        }
      }, debounceDelay);

      this.debounceTimers.set(cacheKey, timer);
    });
  }

  /**
   * Batch multiple API calls into a single request when possible
   */
  async getBatch<T = any>(requests: Array<{
    key: string;
    url: string;
    config?: any;
  }>): Promise<Record<string, T>> {
    // Check if we can use the infrastructure batch endpoint
    const infrastructureRequests = requests.filter(req => 
      req.url.includes('/infrastructure/stats') ||
      req.url.includes('/infrastructure/distribution') ||
      req.url.includes('/infrastructure/recent-changes')
    );

    if (infrastructureRequests.length > 0) {
      return this.getInfrastructureBatch(infrastructureRequests);
    }

    // For other requests, execute them individually but debounced
    const results: Record<string, T> = {};
    const promises = requests.map(async (req) => {
      try {
        const result = await this.get<T>(req.url, req.config);
        results[req.key] = result;
      } catch (error) {
        console.warn(`Batch request failed for ${req.key}:`, error);
        results[req.key] = null as any;
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Special handler for infrastructure batch requests
   */
  private async getInfrastructureBatch<T = any>(requests: Array<{
    key: string;
    url: string;
    config?: any;
  }>): Promise<Record<string, T>> {
    const types: string[] = [];
    const keyMapping: Record<string, string> = {};

    requests.forEach(req => {
      if (req.url.includes('/infrastructure/stats')) {
        types.push('stats');
        keyMapping['stats'] = req.key;
      } else if (req.url.includes('/infrastructure/distribution')) {
        types.push('distribution');
        keyMapping['distribution'] = req.key;
      } else if (req.url.includes('/infrastructure/recent-changes')) {
        types.push('recent-changes');
        keyMapping['recent-changes'] = req.key;
      }
    });

    try {
      const params = new URLSearchParams();
      types.forEach(type => params.append('types', type));
      
      const batchResult = await apiService.get(`/infrastructure/batch?${params.toString()}`);
      
      const results: Record<string, T> = {};
      
      // Map batch results back to individual request keys
      if (batchResult.stats && keyMapping['stats']) {
        results[keyMapping['stats']] = batchResult.stats;
      }
      if (batchResult.distribution && keyMapping['distribution']) {
        results[keyMapping['distribution']] = batchResult.distribution;
      }
      if (batchResult.recentChanges && keyMapping['recent-changes']) {
        results[keyMapping['recent-changes']] = batchResult.recentChanges;
      }

      return results;
    } catch (error) {
      console.warn('Infrastructure batch request failed, falling back to individual requests:', error);
      
      // Fallback to individual requests
      const results: Record<string, T> = {};
      const promises = requests.map(async (req) => {
        try {
          const result = await apiService.get<T>(req.url, req.config);
          results[req.key] = result;
        } catch (error) {
          console.warn(`Individual fallback request failed for ${req.key}:`, error);
          results[req.key] = null as any;
        }
      });

      await Promise.allSettled(promises);
      return results;
    }
  }

  /**
   * Generate cache key from URL and config
   */
  private getCacheKey(url: string, config?: any): string {
    const configStr = config ? JSON.stringify(config) : '';
    return `${url}:${configStr}`;
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    // Remove expired cache entry
    if (cached) {
      this.requestCache.delete(key);
    }
    
    return null;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any, ttl: number): void {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear cache for specific key or all cache
   */
  clearCache(key?: string): void {
    if (key) {
      this.requestCache.delete(key);
    } else {
      this.requestCache.clear();
    }
  }

  /**
   * Cancel pending requests for a specific key
   */
  cancelPendingRequests(key: string): void {
    const requests = this.pendingRequests.get(key);
    if (requests) {
      requests.forEach(request => 
        request.reject(new Error('Request cancelled'))
      );
      this.pendingRequests.delete(key);
    }

    const timer = this.debounceTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(key);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    keys: string[];
    hitRate?: number;
  } {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys()),
    };
  }
}

export const debouncedApiService = new DebouncedApiService();
export default debouncedApiService;