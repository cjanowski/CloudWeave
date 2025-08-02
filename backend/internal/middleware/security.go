package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"cloudweave/internal/models"

	"github.com/gin-gonic/gin"
)

// RateLimiter implements a token bucket rate limiter
type RateLimiter struct {
	buckets map[string]*TokenBucket
	mutex   sync.RWMutex
	limit   int
	window  time.Duration
}

// TokenBucket represents a token bucket for rate limiting
type TokenBucket struct {
	tokens     int
	lastRefill time.Time
	maxTokens  int
	refillRate time.Duration
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		buckets: make(map[string]*TokenBucket),
		limit:   limit,
		window:  window,
	}
}

// Allow checks if a request should be allowed using token bucket algorithm
func (rl *RateLimiter) Allow(key string) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()
	
	now := time.Now()
	bucket, exists := rl.buckets[key]
	
	if !exists {
		bucket = &TokenBucket{
			tokens:     rl.limit,
			lastRefill: now,
			maxTokens:  rl.limit,
			refillRate: rl.window / time.Duration(rl.limit),
		}
		rl.buckets[key] = bucket
	}
	
	// Refill tokens based on time elapsed
	elapsed := now.Sub(bucket.lastRefill)
	tokensToAdd := int(elapsed / bucket.refillRate)
	
	if tokensToAdd > 0 {
		bucket.tokens = min(bucket.maxTokens, bucket.tokens+tokensToAdd)
		bucket.lastRefill = now
	}
	
	// Check if we have tokens available
	if bucket.tokens <= 0 {
		return false
	}
	
	bucket.tokens--
	return true
}

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// AdaptiveRateLimiter provides different rate limits for different endpoint types
type AdaptiveRateLimiter struct {
	readLimiter  *RateLimiter
	writeLimiter *RateLimiter
	authLimiter  *RateLimiter
}

// NewAdaptiveRateLimiter creates a new adaptive rate limiter
func NewAdaptiveRateLimiter() *AdaptiveRateLimiter {
	return &AdaptiveRateLimiter{
		readLimiter:  NewRateLimiter(200, time.Minute),  // 200 reads per minute
		writeLimiter: NewRateLimiter(50, time.Minute),   // 50 writes per minute
		authLimiter:  NewRateLimiter(20, time.Minute),   // 20 auth requests per minute
	}
}

// Allow checks if a request should be allowed based on endpoint type
func (arl *AdaptiveRateLimiter) Allow(key, method, path string) bool {
	// Determine endpoint type
	if strings.Contains(path, "/auth/") || strings.Contains(path, "/login") || strings.Contains(path, "/register") {
		return arl.authLimiter.Allow(key)
	}
	
	if method == "GET" || method == "HEAD" || method == "OPTIONS" {
		return arl.readLimiter.Allow(key)
	}
	
	return arl.writeLimiter.Allow(key)
}

// RateLimitMiddleware provides basic rate limiting functionality
func RateLimitMiddleware(limit int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(limit, window)
	
	return func(c *gin.Context) {
		// Use IP address as key, but could be enhanced to use user ID for authenticated requests
		key := c.ClientIP()
		if userID := c.GetString("userID"); userID != "" {
			key = "user:" + userID
		}
		
		if !limiter.Allow(key) {
			c.JSON(http.StatusTooManyRequests, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "RATE_LIMIT_EXCEEDED",
					Message:   "Too many requests. Please try again later.",
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// AdaptiveRateLimitMiddleware provides adaptive rate limiting based on endpoint type
func AdaptiveRateLimitMiddleware() gin.HandlerFunc {
	limiter := NewAdaptiveRateLimiter()
	
	return func(c *gin.Context) {
		// Use IP address as key, but prefer user ID for authenticated requests
		key := c.ClientIP()
		if userID := c.GetString("userID"); userID != "" {
			key = "user:" + userID
		}
		
		if !limiter.Allow(key, c.Request.Method, c.Request.URL.Path) {
			c.Header("X-RateLimit-Limit", "varies")
			c.Header("X-RateLimit-Remaining", "0")
			c.Header("Retry-After", "60")
			
			c.JSON(http.StatusTooManyRequests, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "RATE_LIMIT_EXCEEDED",
					Message:   "Too many requests. Please try again later.",
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// SecurityHeaders adds security headers to responses
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Security headers
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Header("Content-Security-Policy", "default-src 'self'")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		
		c.Next()
	}
}

// RequestSizeLimit limits the size of request bodies
func RequestSizeLimit(maxSize int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.ContentLength > maxSize {
			c.JSON(http.StatusRequestEntityTooLarge, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "REQUEST_TOO_LARGE",
					Message:   "Request body too large",
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			c.Abort()
			return
		}
		
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxSize)
		c.Next()
	}
}

