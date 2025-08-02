package middleware

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// CacheEntry represents a cached response
type CacheEntry struct {
	Data       []byte
	Headers    map[string]string
	StatusCode int
	Timestamp  time.Time
	TTL        time.Duration
}

// IsExpired checks if the cache entry has expired
func (ce *CacheEntry) IsExpired() bool {
	return time.Since(ce.Timestamp) > ce.TTL
}

// InMemoryCache implements a simple in-memory cache
type InMemoryCache struct {
	entries map[string]*CacheEntry
	mutex   sync.RWMutex
}

// NewInMemoryCache creates a new in-memory cache
func NewInMemoryCache() *InMemoryCache {
	cache := &InMemoryCache{
		entries: make(map[string]*CacheEntry),
	}
	
	// Start cleanup goroutine
	go cache.cleanup()
	
	return cache
}

// cleanup removes expired entries periodically
func (c *InMemoryCache) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	
	for range ticker.C {
		c.mutex.Lock()
		for key, entry := range c.entries {
			if entry.IsExpired() {
				delete(c.entries, key)
			}
		}
		c.mutex.Unlock()
	}
}

// Get retrieves a cache entry
func (c *InMemoryCache) Get(key string) (*CacheEntry, bool) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	
	entry, exists := c.entries[key]
	if !exists || entry.IsExpired() {
		return nil, false
	}
	
	return entry, true
}

// Set stores a cache entry
func (c *InMemoryCache) Set(key string, entry *CacheEntry) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	
	c.entries[key] = entry
}

// generateCacheKey creates a cache key from request details
func generateCacheKey(method, path, query string, userID string) string {
	data := method + ":" + path + ":" + query + ":" + userID
	hash := md5.Sum([]byte(data))
	return hex.EncodeToString(hash[:])
}

// responseWriter wraps gin.ResponseWriter to capture response data
type responseWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *responseWriter) Write(data []byte) (int, error) {
	w.body.Write(data)
	return w.ResponseWriter.Write(data)
}

// CacheMiddleware provides response caching functionality
func CacheMiddleware(ttl time.Duration, cachePaths ...string) gin.HandlerFunc {
	cache := NewInMemoryCache()
	
	// Convert cachePaths to a map for faster lookup
	cachePathMap := make(map[string]bool)
	for _, path := range cachePaths {
		cachePathMap[path] = true
	}
	
	return func(c *gin.Context) {
		// Only cache GET requests
		if c.Request.Method != "GET" {
			c.Next()
			return
		}
		
		// Check if this path should be cached
		shouldCache := len(cachePathMap) == 0 // Cache all if no specific paths provided
		if !shouldCache {
			for path := range cachePathMap {
				if strings.Contains(c.Request.URL.Path, path) {
					shouldCache = true
					break
				}
			}
		}
		
		if !shouldCache {
			c.Next()
			return
		}
		
		// Generate cache key
		userID := c.GetString("userID")
		orgID := c.GetString("organizationId")
		cacheKey := generateCacheKey(
			c.Request.Method,
			c.Request.URL.Path,
			c.Request.URL.RawQuery,
			userID+":"+orgID,
		)
		
		// Try to get from cache
		if entry, exists := cache.Get(cacheKey); exists {
			// Set headers
			for key, value := range entry.Headers {
				c.Header(key, value)
			}
			c.Header("X-Cache", "HIT")
			c.Header("X-Cache-TTL", entry.TTL.String())
			
			c.Data(entry.StatusCode, "application/json", entry.Data)
			c.Abort()
			return
		}
		
		// Wrap response writer to capture response
		writer := &responseWriter{
			ResponseWriter: c.Writer,
			body:          bytes.NewBuffer([]byte{}),
		}
		c.Writer = writer
		
		// Process request
		c.Next()
		
		// Cache successful responses
		if writer.Status() == http.StatusOK && writer.body.Len() > 0 {
			// Capture headers
			headers := make(map[string]string)
			for key, values := range writer.Header() {
				if len(values) > 0 {
					headers[key] = values[0]
				}
			}
			
			entry := &CacheEntry{
				Data:       writer.body.Bytes(),
				Headers:    headers,
				StatusCode: writer.Status(),
				Timestamp:  time.Now(),
				TTL:        ttl,
			}
			
			cache.Set(cacheKey, entry)
			c.Header("X-Cache", "MISS")
		}
	}
}

// SmartCacheMiddleware provides intelligent caching with different TTLs for different endpoints
func SmartCacheMiddleware() gin.HandlerFunc {
	cache := NewInMemoryCache()
	
	// Define TTL for different endpoint patterns
	endpointTTLs := map[string]time.Duration{
		"/infrastructure/stats":           30 * time.Second, // Stats can be cached for 30 seconds
		"/infrastructure/distribution":    60 * time.Second, // Distribution changes less frequently
		"/infrastructure/recent-changes":  15 * time.Second, // Recent changes need fresher data
		"/infrastructure/providers":       5 * time.Minute,  // Providers rarely change
		"/infrastructure/cost":            2 * time.Minute,  // Cost data can be cached longer
		"/infrastructure/metrics":         20 * time.Second, // Metrics need to be relatively fresh
	}
	
	return func(c *gin.Context) {
		// Only cache GET requests
		if c.Request.Method != "GET" {
			c.Next()
			return
		}
		
		// Determine TTL based on endpoint
		var ttl time.Duration
		var shouldCache bool
		
		for pattern, patternTTL := range endpointTTLs {
			if strings.Contains(c.Request.URL.Path, pattern) {
				ttl = patternTTL
				shouldCache = true
				break
			}
		}
		
		if !shouldCache {
			c.Next()
			return
		}
		
		// Generate cache key
		userID := c.GetString("userID")
		orgID := c.GetString("organizationId")
		cacheKey := generateCacheKey(
			c.Request.Method,
			c.Request.URL.Path,
			c.Request.URL.RawQuery,
			userID+":"+orgID,
		)
		
		// Try to get from cache
		if entry, exists := cache.Get(cacheKey); exists {
			// Set headers
			for key, value := range entry.Headers {
				c.Header(key, value)
			}
			c.Header("X-Cache", "HIT")
			c.Header("X-Cache-TTL", entry.TTL.String())
			c.Header("X-Cache-Age", time.Since(entry.Timestamp).String())
			
			c.Data(entry.StatusCode, "application/json", entry.Data)
			c.Abort()
			return
		}
		
		// Wrap response writer to capture response
		writer := &responseWriter{
			ResponseWriter: c.Writer,
			body:          bytes.NewBuffer([]byte{}),
		}
		c.Writer = writer
		
		// Process request
		c.Next()
		
		// Cache successful responses
		if writer.Status() == http.StatusOK && writer.body.Len() > 0 {
			// Capture headers
			headers := make(map[string]string)
			for key, values := range writer.Header() {
				if len(values) > 0 {
					headers[key] = values[0]
				}
			}
			
			entry := &CacheEntry{
				Data:       writer.body.Bytes(),
				Headers:    headers,
				StatusCode: writer.Status(),
				Timestamp:  time.Now(),
				TTL:        ttl,
			}
			
			cache.Set(cacheKey, entry)
			c.Header("X-Cache", "MISS")
			c.Header("X-Cache-TTL", ttl.String())
		}
	}
}

// CacheInvalidationMiddleware provides cache invalidation for write operations
func CacheInvalidationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Process the request first
		c.Next()
		
		// If it's a successful write operation, we could invalidate related cache entries
		// For now, we'll just add headers to indicate cache should be refreshed
		if c.Request.Method != "GET" && c.Writer.Status() >= 200 && c.Writer.Status() < 300 {
			c.Header("X-Cache-Invalidate", "true")
		}
	}
}