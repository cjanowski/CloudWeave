package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"cloudweave/internal/database"
	"cloudweave/internal/models"
	"cloudweave/internal/services"

	"github.com/gin-gonic/gin"
)

// EnhancedHealthHandler demonstrates the new error handling system
type EnhancedHealthHandler struct {
	db           *database.Database
	errorUtils   *ErrorHandlerUtils
	serviceManager *services.ServiceManager
}

// NewEnhancedHealthHandler creates a new enhanced health handler
func NewEnhancedHealthHandler(db *database.Database, serviceManager *services.ServiceManager) *EnhancedHealthHandler {
	return &EnhancedHealthHandler{
		db:             db,
		errorUtils:     NewErrorHandlerUtils(serviceManager),
		serviceManager: serviceManager,
	}
}

// HealthCheckWithEnhancedErrorHandling demonstrates comprehensive health checking with enhanced error handling
func (h *EnhancedHealthHandler) HealthCheckWithEnhancedErrorHandling(c *gin.Context) {
	requestID := c.GetString("requestID")
	
	// Create log context
	logCtx := services.LogContext{
		RequestID: requestID,
		Method:    c.Request.Method,
		Path:      c.Request.URL.Path,
		IPAddress: c.ClientIP(),
		Component: "health_check",
		Operation: "comprehensive_health_check",
	}
	
	// Log health check start
	if h.serviceManager.LoggingService != nil {
		h.serviceManager.LoggingService.Info(logCtx, "Starting comprehensive health check")
	}
	
	healthStatus := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now(),
		"checks":    make(map[string]interface{}),
	}
	
	overallHealthy := true
	
	// Check database connectivity with retry logic
	dbHealthy := h.checkDatabaseHealth(c)
	healthStatus["checks"].(map[string]interface{})["database"] = map[string]interface{}{
		"status": getHealthStatus(dbHealthy),
		"checked_at": time.Now(),
	}
	if !dbHealthy {
		overallHealthy = false
	}
	
	// Check service manager health
	serviceStats := h.serviceManager.GetServiceStats()
	healthStatus["checks"].(map[string]interface{})["services"] = serviceStats
	
	// Check error reporting service
	errorReportingHealthy := h.serviceManager.ErrorReportingService.IsEnabled()
	healthStatus["checks"].(map[string]interface{})["error_reporting"] = map[string]interface{}{
		"status": getHealthStatus(errorReportingHealthy),
		"enabled": errorReportingHealthy,
		"stats": h.serviceManager.ErrorReportingService.GetStats(),
	}
	
	// Check circuit breakers
	circuitBreakerStats := make(map[string]interface{})
	for name, cb := range h.serviceManager.CircuitBreakers {
		stats := cb.GetStats()
		circuitBreakerStats[name] = stats
		
		// Consider circuit breaker unhealthy if it's open
		if stats["state"] == "open" {
			overallHealthy = false
		}
	}
	healthStatus["checks"].(map[string]interface{})["circuit_breakers"] = circuitBreakerStats
	
	// Set overall status
	if !overallHealthy {
		healthStatus["status"] = "unhealthy"
	}
	
	// Log health check completion
	if h.serviceManager.LoggingService != nil {
		logCtx.Metadata = map[string]interface{}{
			"overall_healthy": overallHealthy,
			"checks_count": len(healthStatus["checks"].(map[string]interface{})),
		}
		h.serviceManager.LoggingService.Info(logCtx, "Health check completed")
	}
	
	// Return appropriate status code
	statusCode := http.StatusOK
	if !overallHealthy {
		statusCode = http.StatusServiceUnavailable
	}
	
	c.JSON(statusCode, models.ApiResponse{
		Success:   overallHealthy,
		Data:      healthStatus,
		RequestID: requestID,
	})
}

// checkDatabaseHealth checks database connectivity with enhanced error handling
func (h *EnhancedHealthHandler) checkDatabaseHealth(c *gin.Context) bool {
	// Use retry logic for database health check
	err := h.errorUtils.ExecuteWithRetry(c, "database", "health_check", func(ctx context.Context) error {
		// Simple ping to check database connectivity
		if h.db == nil || h.db.DB == nil {
			return models.NewDatabaseError("Database connection is nil")
		}
		
		ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		
		return h.db.DB.PingContext(ctx)
	})
	
	if err != nil {
		// Log database health check failure
		if h.serviceManager.LoggingService != nil {
			logCtx := services.LogContext{
				RequestID: c.GetString("requestID"),
				Component: "health_check",
				Operation: "database_ping",
				ErrorCategory: models.ErrorCategoryDatabase,
			}
			h.serviceManager.LoggingService.LogError(logCtx, err, "Database health check failed")
		}
		return false
	}
	
	return true
}

// DemonstrateErrorHandling demonstrates various error handling scenarios
func (h *EnhancedHealthHandler) DemonstrateErrorHandling(c *gin.Context) {
	errorType := c.Query("error_type")
	
	switch errorType {
	case "validation":
		// Demonstrate validation error
		details := map[string]interface{}{
			"field": "error_type",
			"value": errorType,
			"expected": "one of: database, external, timeout, panic",
		}
		h.errorUtils.HandleValidationError(c, fmt.Errorf("invalid error type"), details)
		return
		
	case "database":
		// Demonstrate database error with retry
		err := h.errorUtils.ExecuteWithRetry(c, "database", "demo_operation", func(ctx context.Context) error {
			return models.NewDatabaseError("Simulated database error")
		})
		if err != nil {
			h.errorUtils.HandleDatabaseError(c, err, "demo_database_operation")
			return
		}
		
	case "external":
		// Demonstrate external service error
		h.errorUtils.HandleExternalServiceError(c, "demo_service", fmt.Errorf("simulated external service error"), "demo_external_call")
		return
		
	case "timeout":
		// Demonstrate timeout error
		timeoutErr := models.NewTimeoutError("demo_operation")
		h.errorUtils.HandleError(c, timeoutErr, "demo_timeout")
		return
		
	case "panic":
		// Demonstrate panic handling (this will be caught by the panic middleware)
		panic("Simulated panic for demonstration")
		
	case "security":
		// Demonstrate security event logging
		h.errorUtils.LogSecurityEvent(c, "SUSPICIOUS_ACTIVITY", "Demo security event", "HIGH")
		h.errorUtils.RespondWithSuccess(c, map[string]string{"message": "Security event logged"})
		return
		
	case "audit":
		// Demonstrate audit event logging
		changes := map[string]interface{}{
			"action": "demo_audit",
			"resource": "demo_resource",
			"old_value": "old",
			"new_value": "new",
		}
		h.errorUtils.LogAuditEvent(c, "UPDATE", "demo_resource", changes)
		h.errorUtils.RespondWithSuccess(c, map[string]string{"message": "Audit event logged"})
		return
		
	default:
		// Demonstrate successful response
		h.errorUtils.RespondWithSuccess(c, map[string]interface{}{
			"message": "Error handling demonstration",
			"available_types": []string{"validation", "database", "external", "timeout", "panic", "security", "audit"},
			"usage": "Add ?error_type=<type> to demonstrate different error scenarios",
		})
	}
}

// getHealthStatus converts boolean to status string
func getHealthStatus(healthy bool) string {
	if healthy {
		return "healthy"
	}
	return "unhealthy"
}