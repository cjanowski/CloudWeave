import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { apiService } from '../services/apiService';
import type { LoadingState } from '../services/apiService';
import type { RootState } from '../store';

export interface UseApiWithFallbackOptions {
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
}

export interface UseApiWithFallbackResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isDemo: boolean;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export function useApiWithFallback<T = any>(
  url: string,
  options: UseApiWithFallbackOptions = {}
): UseApiWithFallbackResult<T> {
  const {
    autoFetch = true,
    pollingInterval = 0,
    showLoadingOnRefresh = false,
    onError,
    onSuccess,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [pollingTimer, setPollingTimer] = useState<NodeJS.Timeout | null>(null);

  // Get demo state from Redux
  const { isDemo } = useSelector((state: RootState) => state.demo);

  // Subscribe to loading state changes from API service
  useEffect(() => {
    const loadingKey = `get:${url}`;
    const unsubscribe = apiService.subscribe(`loading:${loadingKey}`, (loadingState: LoadingState) => {
      if (showLoadingOnRefresh || !data) {
        setLoading(loadingState.isLoading);
      }
      setError(loadingState.error);
      if (loadingState.lastUpdated) {
        setLastUpdated(loadingState.lastUpdated);
      }
    });

    return unsubscribe;
  }, [url, data, showLoadingOnRefresh]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      if (!data || showLoadingOnRefresh) {
        setLoading(true);
      }

      const result = await apiService.get<T>(url);
      setData(result);
      setLastUpdated(new Date().toISOString());
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch data';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [url, data, showLoadingOnRefresh, onSuccess, onError]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Setup polling
  useEffect(() => {
    if (pollingInterval > 0 && data) {
      const timer = setInterval(fetchData, pollingInterval);
      setPollingTimer(timer);
      
      return () => {
        clearInterval(timer);
        setPollingTimer(null);
      };
    }
  }, [pollingInterval, data, fetchData]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
      }
    };
  }, [pollingTimer]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    isDemo,
    refetch: fetchData,
    clearError,
  };
}

// Specialized hooks for common use cases
export function useInfrastructureData() {
  return useApiWithFallback('/infrastructure', {
    pollingInterval: 30000, // Poll every 30 seconds
    showLoadingOnRefresh: false,
  });
}

export function useDeploymentData() {
  return useApiWithFallback('/deployments', {
    pollingInterval: 15000, // Poll every 15 seconds
    showLoadingOnRefresh: false,
  });
}

export function useDashboardStats() {
  return useApiWithFallback('/dashboard/stats', {
    pollingInterval: 60000, // Poll every minute
    showLoadingOnRefresh: false,
  });
}

export function useMetricsData(resourceId?: string) {
  const url = resourceId ? `/metrics?resourceId=${resourceId}` : '/metrics';
  return useApiWithFallback(url, {
    pollingInterval: 10000, // Poll every 10 seconds
    showLoadingOnRefresh: false,
  });
}

export function useAlertsData() {
  return useApiWithFallback('/alerts', {
    pollingInterval: 30000, // Poll every 30 seconds
    showLoadingOnRefresh: false,
  });
}

export function useCostData() {
  return useApiWithFallback('/cost', {
    pollingInterval: 300000, // Poll every 5 minutes
    showLoadingOnRefresh: false,
  });
}