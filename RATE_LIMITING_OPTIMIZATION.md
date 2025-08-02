# Rate Limiting and Performance Optimization

## Problem Analysis

The frontend was experiencing 429 (Too Many Requests) errors due to:

1. **Aggressive API calls**: Multiple endpoints being called simultaneously on page load
2. **React StrictMode**: Double-invocation of effects causing duplicate requests
3. **No request deduplication**: Same requests being made multiple times rapidly
4. **Lack of caching**: Every request hitting the backend even for static data
5. **Simple rate limiting**: Basic rate limiter not accounting for different endpoint types

## Solutions Implemented

### 1. Backend Optimizations

#### Enhanced Rate Limiting (`backend/internal/middleware/security.go`)
- **Token Bucket Algorithm**: More sophisticated rate limiting using token buckets
- **Adaptive Rate Limiting**: Different limits for different endpoint types:
  - Read operations: 200 requests/minute
  - Write operations: 50 requests/minute  
  - Auth operations: 20 requests/minute
- **User-based limiting**: Rate limits per user rather than just IP

#### Smart Caching (`backend/internal/middleware/cache.go`)
- **Endpoint-specific TTLs**: Different cache durations for different data types:
  - Infrastructure stats: 30 seconds
  - Resource distribution: 60 seconds
  - Recent changes: 15 seconds
  - Providers: 5 minutes
- **In-memory cache**: Fast response times for cached data
- **Cache headers**: Proper HTTP cache headers for client-side caching

#### Request Deduplication (`backend/internal/middleware/deduplication.go`)
- **Duplicate detection**: Prevents identical requests within short time windows
- **Endpoint-specific windows**: Different deduplication windows for different endpoints
- **React StrictMode handling**: Specifically addresses double-invocation issues

#### Batch API Endpoint (`backend/internal/handlers/infrastructure.go`)
- **Single request for multiple data types**: `/infrastructure/batch` endpoint
- **Reduced HTTP overhead**: One request instead of three separate calls
- **Optimized database queries**: Single query with multiple calculations

### 2. Frontend Optimizations

#### Debounced API Service (`frontend/src/services/debouncedApiService.ts`)
- **Request batching**: Groups identical requests together
- **Intelligent caching**: Client-side cache with configurable TTLs
- **Infrastructure batch support**: Automatically uses batch endpoint when possible
- **Request deduplication**: Prevents duplicate requests at the client level

#### Optimized React Hooks (`frontend/src/hooks/useOptimizedApi.ts`)
- **StrictMode safe**: Handles React StrictMode double-invocation properly
- **Request cancellation**: Cancels pending requests on component unmount
- **Proper cleanup**: Prevents memory leaks and state updates on unmounted components
- **Batch data hook**: Specialized hook for infrastructure batch requests

#### Updated Infrastructure Service (`frontend/src/services/infrastructureService.ts`)
- **Correct endpoints**: Updated to use the proper API endpoints
- **Batch support**: Added method to fetch multiple data types at once
- **Better error handling**: Improved error handling and fallbacks

#### Icon Registry Fix (`frontend/src/services/iconRegistry.ts`)
- **Missing icon**: Added `refresh-cw` alias to fix console warnings

### 3. Configuration Updates

#### Main Server Configuration (`backend/cmd/main.go`)
- **Middleware order**: Proper ordering of middleware for optimal performance
- **Route registration**: Added missing infrastructure endpoints
- **Batch endpoint**: Registered the new batch endpoint

## Performance Improvements

### Request Reduction
- **Before**: 3+ separate API calls for infrastructure overview
- **After**: 1 batch API call for all infrastructure data
- **Improvement**: ~70% reduction in HTTP requests

### Response Times
- **Cached responses**: Sub-millisecond response times for cached data
- **Reduced database load**: Fewer database queries due to caching
- **Batch processing**: More efficient data retrieval

### Rate Limiting
- **Before**: 100 requests/minute globally
- **After**: 200 reads + 50 writes + 20 auth requests/minute per user
- **Improvement**: More appropriate limits for different operation types

### Client-Side Optimizations
- **Request deduplication**: Eliminates duplicate requests from React StrictMode
- **Intelligent caching**: Reduces unnecessary API calls
- **Proper cleanup**: Prevents memory leaks and race conditions

## Usage Examples

### Using the Optimized Hook
```typescript
import { useOptimizedApi, useInfrastructureBatch } from '../hooks/useOptimizedApi';

// Single endpoint with optimization
const { data, loading, error } = useOptimizedApi('/infrastructure/stats', {
  cacheTTL: 30000,
  debounceDelay: 200,
  pollingInterval: 30000
});

// Batch data fetching
const { data: batchData } = useInfrastructureBatch();
```

### Using the Batch Endpoint
```bash
# Single request for multiple data types
GET /api/v1/infrastructure/batch?types=stats&types=distribution&types=recent-changes
```

## Monitoring and Debugging

### Cache Headers
- `X-Cache`: HIT/MISS indicator
- `X-Cache-TTL`: Cache time-to-live
- `X-Cache-Age`: Age of cached data

### Rate Limiting Headers
- `X-RateLimit-Limit`: Current rate limit
- `X-RateLimit-Remaining`: Remaining requests
- `Retry-After`: When to retry after rate limit

### Debug Information
- Request deduplication: `X-Request-Deduplicated` header
- Cache invalidation: `X-Cache-Invalidate` header

## Future Improvements

1. **Redis caching**: Move from in-memory to Redis for distributed caching
2. **WebSocket updates**: Real-time updates to reduce polling
3. **GraphQL**: Consider GraphQL for more efficient data fetching
4. **Service worker**: Implement service worker for offline caching
5. **Database optimization**: Add database indexes for frequently queried data

## Testing

To test the optimizations:

1. **Load the infrastructure page**: Should see significantly fewer 429 errors
2. **Check network tab**: Fewer HTTP requests, faster response times
3. **Monitor cache headers**: Verify caching is working properly
4. **Test React StrictMode**: No duplicate requests should occur

The optimizations should result in a much smoother user experience with faster load times and no rate limiting errors.