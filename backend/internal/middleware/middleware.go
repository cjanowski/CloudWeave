package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/services"

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

// ErrorHandler middleware handles panics and errors with comprehensive logging
func ErrorHandler() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		requestID := c.GetString("requestID")
		userID := c.GetString("userID")
		
		// Log the panic with context
		fmt.Printf("[PANIC] RequestID: %s, UserID: %s, Method: %s, Path: %s, Error: %v\n",
			requestID, userID, c.Request.Method, c.Request.URL.Path, recovered)
		
		// Return standardized error response
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INTERNAL_SERVER_ERROR",
				Message:   "An internal server error occurred",
				Timestamp: time.Now(),
			},
			RequestID: requestID,
		})
	})
}

// ProductionErrorHandler provides comprehensive error handling for production
func ProductionErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		
		// Handle any errors that occurred during request processing
		if len(c.Errors) > 0 {
			err := c.Errors.Last()
			requestID := c.GetString("requestID")
			userID := c.GetString("userID")
			
			// Log error with context
			fmt.Printf("[ERROR] RequestID: %s, UserID: %s, Method: %s, Path: %s, Error: %v\n",
				requestID, userID, c.Request.Method, c.Request.URL.Path, err.Err)
			
			// Determine error type and response
			statusCode := http.StatusInternalServerError
			errorCode := "INTERNAL_ERROR"
			errorMessage := "An internal error occurred"
			
			// Check for specific error types
			if strings.Contains(err.Error(), "validation") {
				statusCode = http.StatusBadRequest
				errorCode = "VALIDATION_ERROR"
				errorMessage = "Request validation failed"
			} else if strings.Contains(err.Error(), "unauthorized") {
				statusCode = http.StatusUnauthorized
				errorCode = "UNAUTHORIZED"
				errorMessage = "Authentication required"
			} else if strings.Contains(err.Error(), "forbidden") {
				statusCode = http.StatusForbidden
				errorCode = "FORBIDDEN"
				errorMessage = "Access denied"
			} else if strings.Contains(err.Error(), "not found") {
				statusCode = http.StatusNotFound
				errorCode = "NOT_FOUND"
				errorMessage = "Resource not found"
			}
			
			c.JSON(statusCode, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      errorCode,
					Message:   errorMessage,
					Timestamp: time.Now(),
				},
				RequestID: requestID,
			})
		}
	}
}

// AuthRequired middleware validates JWT tokens
func AuthRequired(jwtService *services.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "UNAUTHORIZED",
					Message:   "Authorization header required",
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		tokenString := ""
		if len(authHeader) > 7 && strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = authHeader[7:]
		} else {
			c.JSON(http.StatusUnauthorized, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "INVALID_TOKEN_FORMAT",
					Message:   "Invalid authorization header format. Expected 'Bearer <token>'",
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			c.Abort()
			return
		}

		// Validate JWT token
		claims, err := jwtService.ValidateToken(c.Request.Context(), tokenString)
		if err != nil {
			errorCode := "INVALID_TOKEN"
			errorMessage := "Invalid or malformed token"

			if err == services.ErrExpiredToken {
				errorCode = "TOKEN_EXPIRED"
				errorMessage = "Token has expired"
			} else if err == services.ErrInvalidSignature {
				errorCode = "INVALID_SIGNATURE"
				errorMessage = "Invalid token signature"
			}

			c.JSON(http.StatusUnauthorized, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      errorCode,
					Message:   errorMessage,
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			c.Abort()
			return
		}

		// Set user information in context for use by handlers
		c.Set("userID", claims.UserID)
		c.Set("userEmail", claims.Email)
		c.Set("userName", claims.Name)
		c.Set("userRole", claims.Role)
		c.Set("organizationId", claims.OrganizationID)
		c.Set("tokenID", claims.TokenID)
		c.Set("token", tokenString)

		c.Next()
	}
}

// WebSocketAuthRequired middleware validates JWT tokens for WebSocket connections
// It checks both Authorization header and query parameter for token
func WebSocketAuthRequired(jwtService *services.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string

		// First try Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" && len(authHeader) > 7 && strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = authHeader[7:]
		} else {
			// Fall back to query parameter for WebSocket connections
			tokenString = c.Query("token")
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "UNAUTHORIZED",
					Message:   "Authentication token required (Authorization header or token query parameter)",
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			c.Abort()
			return
		}

		// Validate JWT token
		claims, err := jwtService.ValidateToken(c.Request.Context(), tokenString)
		if err != nil {
			errorCode := "INVALID_TOKEN"
			errorMessage := "Invalid or malformed token"

			if err == services.ErrExpiredToken {
				errorCode = "TOKEN_EXPIRED"
				errorMessage = "Token has expired"
			} else if err == services.ErrInvalidSignature {
				errorCode = "INVALID_SIGNATURE"
				errorMessage = "Invalid token signature"
			}

			c.JSON(http.StatusUnauthorized, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      errorCode,
					Message:   errorMessage,
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			c.Abort()
			return
		}

		// Set user information in context for use by handlers
		c.Set("userID", claims.UserID)
		c.Set("userEmail", claims.Email)
		c.Set("userName", claims.Name)
		c.Set("userRole", claims.Role)
		c.Set("organizationId", claims.OrganizationID)
		c.Set("tokenID", claims.TokenID)
		c.Set("token", tokenString)

		c.Next()
	}
}
