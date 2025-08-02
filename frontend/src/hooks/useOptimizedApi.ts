import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { debouncedApiService } from '../services/debouncedApiService';
import type { RootState } from '../store';

export interface UseOptimizedApiOptions {
  // Whether to automatically fetch data on mount
  autoFetch?: boolean;
  // Polling interval in milliseconds (0 to disable)
  pollingInterval?: number;
  // Whether to show loading state for subsequent requests
  showLoadingOnRefresh?: boolean;
  // Custom error handler
  onError?: (error: any) => void;
  // Custom success handler
  onSuccess?: (data: any) => void;
  // Debounce delay in milliseconds
  debounceDelay?: number;
  // Cache TTL in milliseconds
  cacheTTL?: number;
  // Whether to use React.StrictMode safe effects
  strictMode?: boolean;
}

export interface UseOptimizedApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isDemo: boolean;
  refetch: () => Promise<void>;
  clearError: () => void;
  clearCache: () => void;
}

export function useOptimizedApi<T = any>(
  url: string,
  options: UseOptimizedApiOptions = {}
): UseOptimizedApiResult<T> {
  const {
    autoFetch = true,
    pollingInterval = 0,
    showLoadingOnRefresh = false,
    onError,
    onSuccess,
    debounceDelay = 100,
    cacheTTL = 30000,
    strictMode = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Use refs to track component state for cleanup
  const isMountedRef = useRef(true);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const requestCounterRef = useRef(0);

  // Get demo state from Redux
  const { isDemo } = useSelector((state: RootState) => state.demo);

  // Fetch data function with debouncing
  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    const requestId = ++requestCounterRef.current;
    
    try {
      setError(null);
      if (!data || showLoadingOnRefresh) {
        setLoading(true);
      }

      const result = await debouncedApiService.get<T>(url, undefined, debounceDelay, cacheTTL);
      
      // Only update state if this is the latest request and component is still mounted
      if (requestId === requestCounterRef.current && isMountedRef.current) {
        setData(result);
        setLastUpdated(new Date().toISOString());
        
        if (onSuccess) {
          onSuccess(result);
        }
      }
    } catch (err: any) {
      // Only update error state if this is the latest request and component is still mounted
      if (requestId === requestCounterRef.current && isMountedRef.current) {
        const errorMessage = err.message || 'Failed to fetch data';
        setError(errorMessage);
        
        if (onError) {
          onError(err);
        }
      }
    } finally {
      if (requestId === requestCounterRef.current && isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [url, data, showLoadingOnRefresh, onSuccess, onError, debounceDelay, cacheTTL]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear cache function
  const clearCache = useCallback(() => {
    debouncedApiService.clearCache(url);
  }, [url]);

  // Setup polling with proper cleanup
  useEffect(() => {
    if (pollingInterval > 0 && data && isMountedRef.current) {
      pollingTimerRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchData();
        }
      }, pollingInterval);
      
      return () => {
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
      };
    }
  }, [pollingInterval, data, fetchData]);

  // Auto-fetch on mount with StrictMode handling
  useEffect(() => {
    if (autoFetch && isMountedRef.current) {
      // In StrictMode, effects run twice, so we use a flag to prevent double execution
      let shouldFetch = true;
      
      if (strictMode) {
        // Small delay to allow for potential duplicate effect cleanup
        const timer = setTimeout(() => {
          if (shouldFetch && isMountedRef.current) {
            fetchData();
          }
        }, 10);
        
        return () => {
          shouldFetch = false;
          clearTimeout(timer);
        };
      } else {
        fetchData();
      }
    }
  }, [autoFetch, fetchData, strictMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Clear polling timer
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      
      // Cancel any pending requests
      debouncedApiService.cancelPendingRequests(url);
    };
  }, [url]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    isDemo,
    refetch: fetchData,
    clearError,
    clearCache,
  };
}

// Specialized hook for infrastructure batch data
export function useInfrastructureBatch() {
  const [data, setData] = useState<{
    stats?: any;
    distribution?: any;
    recentChanges?: any;
    timestamp?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const { isDemo } = useSelector((state: RootState) => state.demo);

  const fetchBatchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setError(null);
      setLoading(true);

      const batchRequests = [
        { key: 'stats', url: '/infrastructure/stats' },
        { key: 'distribution', url: '/infrastructure/distribution' },
        { key: 'recentChanges', url: '/infrastructure/recent-changes' },
      ];

      const results = await debouncedApiService.getBatch(batchRequests);
      
      if (isMountedRef.current) {
        setData({
          stats: results.stats,
          distribution: results.distribution,
          recentChanges: results.recentChanges,
          timestamp: Date.now(),
        });
        setLastUpdated(new Date().toISOString());
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorMessage = err.message || 'Failed to fetch batch data';
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    let shouldFetch = true;
    
    const timer = setTimeout(() => {
      if (shouldFetch && isMountedRef.current) {
        fetchBatchData();
      }
    }, 10);
    
    return () => {
      shouldFetch = false;
      clearTimeout(timer);
    };
  }, [fetchBatchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    isDemo,
    refetch: fetchBatchData,
    clearError: () => setError(null),
  };
}

// Optimized hooks for common use cases
export function useOptimizedInfrastructureStats() {
  return useOptimizedApi('/infrastructure/stats', {
    pollingInterval: 30000, // Poll every 30 seconds
    showLoadingOnRefresh: false,
    cacheTTL: 30000, // Cache for 30 seconds
    debounceDelay: 200, // Debounce for 200ms
  });
}

export function useOptimizedResourceDistribution() {
  return useOptimizedApi('/infrastructure/distribution', {
    pollingInterval: 60000, // Poll every minute
    showLoadingOnRefresh: false,
    cacheTTL: 60000, // Cache for 1 minute
    debounceDelay: 200,
  });
}

export function useOptimizedRecentChanges() {
  return useOptimizedApi('/infrastructure/recent-changes', {
    pollingInterval: 15000, // Poll every 15 seconds
    showLoadingOnRefresh: false,
    cacheTTL: 15000, // Cache for 15 seconds
    debounceDelay: 100,
  });
}