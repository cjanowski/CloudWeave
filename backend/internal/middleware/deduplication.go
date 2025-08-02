package middleware

import (
	"crypto/md5"
	"encoding/hex"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RequestDeduplicator prevents duplicate requests within a short time window
type RequestDeduplicator struct {
	requests map[string]time.Time
	mutex    sync.RWMutex
	window   time.Duration
}

// NewRequestDeduplicator creates a new request deduplicator
func NewRequestDeduplicator(window time.Duration) *RequestDeduplicator {
	dedup := &RequestDeduplicator{
		requests: make(map[string]time.Time),
		window:   window,
	}
	
	// Start cleanup goroutine
	go dedup.cleanup()
	
	return dedup
}

// cleanup removes old request records periodically
func (rd *RequestDeduplicator) cleanup() {
	ticker := time.NewTicker(rd.window)
	defer ticker.Stop()
	
	for range ticker.C {
		rd.mutex.Lock()
		cutoff := time.Now().Add(-rd.window)
		for key, timestamp := range rd.requests {
			if timestamp.Before(cutoff) {
				delete(rd.requests, key)
			}
		}
		rd.mutex.Unlock()
	}
}

// generateRequestKey creates a unique key for the request
func (rd *RequestDeduplicator) generateRequestKey(c *gin.Context) string {
	// Include method, path, query, and user identification
	userID := c.GetString("userID")
	orgID := c.GetString("organizationId")
	clientIP := c.ClientIP()
	
	data := c.Request.Method + ":" + 
		   c.Request.URL.Path + ":" + 
		   c.Request.URL.RawQuery + ":" + 
		   userID + ":" + 
		   orgID + ":" + 
		   clientIP
	
	hash := md5.Sum([]byte(data))
	return hex.EncodeToString(hash[:])
}

// IsDuplicate checks if this is a duplicate request
func (rd *RequestDeduplicator) IsDuplicate(c *gin.Context) bool {
	// Only check GET requests for deduplication
	if c.Request.Method != "GET" {
		return false
	}
	
	key := rd.generateRequestKey(c)
	now := time.Now()
	
	rd.mutex.Lock()
	defer rd.mutex.Unlock()
	
	if lastRequest, exists := rd.requests[key]; exists {
		if now.Sub(lastRequest) < rd.window {
			return true
		}
	}
	
	rd.requests[key] = now
	return false
}

// DeduplicationMiddleware prevents duplicate requests within a short time window
func DeduplicationMiddleware(window time.Duration) gin.HandlerFunc {
	deduplicator := NewRequestDeduplicator(window)
	
	return func(c *gin.Context) {
		if deduplicator.IsDuplicate(c) {
			c.Header("X-Request-Deduplicated", "true")
			// Return 429 for duplicate requests to signal the client to slow down
			c.JSON(429, gin.H{
				"error": "Duplicate request detected. Please wait before retrying.",
				"code":  "DUPLICATE_REQUEST",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// SmartDeduplicationMiddleware provides intelligent deduplication for specific endpoints
func SmartDeduplicationMiddleware() gin.HandlerFunc {
	// Different deduplication windows for different endpoints
	deduplicators := map[string]*RequestDeduplicator{
		"/infrastructure/stats":           NewRequestDeduplicator(5 * time.Second),
		"/infrastructure/distribution":    NewRequestDeduplicator(10 * time.Second),
		"/infrastructure/recent-changes":  NewRequestDeduplicator(3 * time.Second),
		"/infrastructure/metrics":         NewRequestDeduplicator(5 * time.Second),
	}
	
	return func(c *gin.Context) {
		// Find matching deduplicator
		var deduplicator *RequestDeduplicator
		for pattern, dedup := range deduplicators {
			if c.Request.URL.Path == pattern || 
			   (len(c.Request.URL.Path) > len(pattern) && 
			    c.Request.URL.Path[:len(pattern)] == pattern) {
				deduplicator = dedup
				break
			}
		}
		
		// If no specific deduplicator found, skip
		if deduplicator == nil {
			c.Next()
			return
		}
		
		if deduplicator.IsDuplicate(c) {
			c.Header("X-Request-Deduplicated", "true")
			c.JSON(429, gin.H{
				"error": "Duplicate request detected. Please wait before retrying.",
				"code":  "DUPLICATE_REQUEST",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}