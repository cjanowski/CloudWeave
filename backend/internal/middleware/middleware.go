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

// StructuredLogger provides structured logging for HTTP requests
func StructuredLogger(loggingService *services.LoggingService) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		
		// Process request
		c.Next()
		
		// Calculate duration
		duration := time.Since(start)
		
		// Create log context
		logCtx := services.LogContext{
			RequestID:      c.GetString("requestID"),
			UserID:         c.GetString("userID"),
			UserEmail:      c.GetString("userEmail"),
			OrganizationID: c.GetString("organizationId"),
			Method:         c.Request.Method,
			Path:           c.Request.URL.Path,
			IPAddress:      c.ClientIP(),
			UserAgent:      c.Request.UserAgent(),
			Duration:       duration,
			StatusCode:     c.Writer.Status(),
			Metadata: map[string]interface{}{
				"request_size":  c.Request.ContentLength,
				"response_size": c.Writer.Size(),
				"protocol":      c.Request.Proto,
				"query_params":  c.Request.URL.RawQuery,
			},
		}
		
		// Log request completion
		message := fmt.Sprintf("HTTP %s %s completed", c.Request.Method, c.Request.URL.Path)
		
		if loggingService != nil {
			if c.Writer.Status() >= 400 {
				loggingService.Error(logCtx, message)
			} else {
				loggingService.LogRequest(logCtx, message)
			}
		}
	}
}

// ErrorHandler middleware handles panics and errors with comprehensive logging
func ErrorHandler(loggingService *services.LoggingService, errorReportingService *services.ErrorReportingService) gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		requestID := c.GetString("requestID")
		userID := c.GetString("userID")
		userEmail := c.GetString("userEmail")
		organizationID := c.GetString("organizationId")
		
		// Create log context
		logCtx := services.LogContext{
			RequestID:      requestID,
			UserID:         userID,
			UserEmail:      userEmail,
			OrganizationID: organizationID,
			Method:         c.Request.Method,
			Path:           c.Request.URL.Path,
			IPAddress:      c.ClientIP(),
			UserAgent:      c.Request.UserAgent(),
			StatusCode:     http.StatusInternalServerError,
		}
		
		// Log the panic
		if loggingService != nil {
			loggingService.LogPanic(logCtx, recovered, "Panic occurred during request processing")
		}
		
		// Report panic to external service if enabled
		if errorReportingService != nil && errorReportingService.IsEnabled() {
			reportCtx := services.ErrorReportContext{
				RequestID:      requestID,
				UserID:         userID,
				UserEmail:      userEmail,
				OrganizationID: organizationID,
				Method:         c.Request.Method,
				Path:           c.Request.URL.Path,
				IPAddress:      c.ClientIP(),
				UserAgent:      c.Request.UserAgent(),
			}
			go errorReportingService.ReportPanic(c.Request.Context(), recovered, reportCtx)
		}
		
		// Create error response
		appErr := models.NewInternalError(fmt.Sprintf("Panic occurred: %v", recovered))
		appErr.WithRequestID(requestID).WithUserID(userID)
		
		// Return standardized error response
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(appErr, requestID))
	})
}

// ProductionErrorHandler provides comprehensive error handling for production
func ProductionErrorHandler(loggingService *services.LoggingService, errorReportingService *services.ErrorReportingService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		
		// Handle any errors that occurred during request processing
		if len(c.Errors) > 0 {
			err := c.Errors.Last()
			requestID := c.GetString("requestID")
			userID := c.GetString("userID")
			userEmail := c.GetString("userEmail")
			organizationID := c.GetString("organizationId")
			
			// Create log context
			logCtx := services.LogContext{
				RequestID:      requestID,
				UserID:         userID,
				UserEmail:      userEmail,
				OrganizationID: organizationID,
				Method:         c.Request.Method,
				Path:           c.Request.URL.Path,
				IPAddress:      c.ClientIP(),
				UserAgent:      c.Request.UserAgent(),
				StatusCode:     c.Writer.Status(),
			}
			
			var appErr *models.AppError
			
			// Check if it's already an AppError
			if ae, ok := err.Err.(*models.AppError); ok {
				appErr = ae.WithRequestID(requestID).WithUserID(userID)
			} else {
				// Convert generic error to AppError
				appErr = convertToAppError(err.Err).WithRequestID(requestID).WithUserID(userID)
			}
			
			// Log the error
			if loggingService != nil {
				loggingService.LogError(logCtx, appErr, "Request processing error")
			}
			
			// Report to external service if enabled
			if errorReportingService != nil && errorReportingService.IsEnabled() {
				reportCtx := services.ErrorReportContext{
					RequestID:      requestID,
					UserID:         userID,
					UserEmail:      userEmail,
					OrganizationID: organizationID,
					Method:         c.Request.Method,
					Path:           c.Request.URL.Path,
					IPAddress:      c.ClientIP(),
					UserAgent:      c.Request.UserAgent(),
				}
				go errorReportingService.ReportError(c.Request.Context(), appErr, reportCtx)
			}
			
			// Return standardized error response
			c.JSON(appErr.StatusCode, models.NewErrorResponse(appErr, requestID))
		}
	}
}

// convertToAppError converts a generic error to an AppError
func convertToAppError(err error) *models.AppError {
	errStr := err.Error()
	
	// Check for specific error patterns
	if strings.Contains(strings.ToLower(errStr), "validation") {
		return models.NewValidationError("Request validation failed", nil)
	} else if strings.Contains(strings.ToLower(errStr), "unauthorized") {
		return models.NewAuthenticationError("Authentication required")
	} else if strings.Contains(strings.ToLower(errStr), "forbidden") {
		return models.NewAuthorizationError("Access denied")
	} else if strings.Contains(strings.ToLower(errStr), "not found") {
		return models.NewNotFoundError("Resource")
	} else if strings.Contains(strings.ToLower(errStr), "database") || strings.Contains(strings.ToLower(errStr), "sql") {
		return models.NewDatabaseError(errStr)
	} else if strings.Contains(strings.ToLower(errStr), "timeout") {
		return models.NewTimeoutError("Request")
	}
	
	// Default to internal error
	return models.NewInternalError(errStr)
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
// MetricsMiddleware collects performance metrics
func MetricsMiddleware(loggingService *services.LoggingService) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		
		// Process request
		c.Next()
		
		// Calculate metrics
		duration := time.Since(start)
		statusCode := c.Writer.Status()
		
		// Create log context
		logCtx := services.LogContext{
			RequestID:      c.GetString("requestID"),
			UserID:         c.GetString("userID"),
			Method:         c.Request.Method,
			Path:           c.Request.URL.Path,
			StatusCode:     statusCode,
			Duration:       duration,
		}
		
		// Log performance metrics
		if loggingService != nil {
			loggingService.LogPerformanceMetric(logCtx, "http_request_duration", float64(duration.Milliseconds()), "ms")
			loggingService.LogPerformanceMetric(logCtx, "http_request_size", float64(c.Request.ContentLength), "bytes")
			loggingService.LogPerformanceMetric(logCtx, "http_response_size", float64(c.Writer.Size()), "bytes")
		}
		
		// Log slow requests
		if duration > 5*time.Second {
			if loggingService != nil {
				loggingService.Warn(logCtx, fmt.Sprintf("Slow request detected: %s %s took %v", c.Request.Method, c.Request.URL.Path, duration))
			}
		}
	}
}

// HealthCheckMiddleware for health check endpoints
func HealthCheckMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Add health check headers
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Header("Pragma", "no-cache")
		c.Header("Expires", "0")
		
		c.Next()
	}
}