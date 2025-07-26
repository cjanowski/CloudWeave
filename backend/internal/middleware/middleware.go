package middleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RequestID middleware adds a unique request ID to each request
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = "req_" + uuid.New().String()
		}
		c.Set("requestID", requestID)
		c.Header("X-Request-ID", requestID)
		c.Next()
	}
}

// Logger middleware logs HTTP requests
func Logger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format(time.RFC1123),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	})
}

// ErrorHandler middleware handles panics and errors
func ErrorHandler() gin.HandlerFunc {
	return gin.Recovery()
}

// AuthRequired middleware validates JWT tokens
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": map[string]interface{}{
					"code":      "UNAUTHORIZED",
					"message":   "Authorization header required",
					"timestamp": time.Now(),
				},
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		tokenString := ""
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			tokenString = authHeader[7:]
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": map[string]interface{}{
					"code":      "INVALID_TOKEN_FORMAT",
					"message":   "Invalid authorization header format",
					"timestamp": time.Now(),
				},
			})
			c.Abort()
			return
		}

		// TODO: Validate JWT token here
		// For now, we'll just pass through
		c.Set("token", tokenString)
		c.Next()
	}
}