package handlers

import (
	"net/http"

	"cloudweave/internal/models"
	"cloudweave/internal/services"

	"github.com/gin-gonic/gin"
)

// ErrorHandlerUtils provides utilities for consistent error handling in handlers
type ErrorHandlerUtils struct {
	serviceManager *services.ServiceManager
}

// NewErrorHandlerUtils creates a new error handler utilities instance
func NewErrorHandlerUtils(serviceManager *services.ServiceManager) *ErrorHandlerUtils {
	return &ErrorHandlerUtils{
		serviceManager: serviceManager,
	}
}

// HandleError handles an error with proper logging and response
func (ehu *ErrorHandlerUtils) HandleError(c *gin.Context, err error, operation string) {
	if err == nil {
		return
	}

	requestID := c.GetString("requestID")
	userID := c.GetString("userID")
	
	var appErr *models.AppError
	
	// Convert to AppError if not already
	if ae, ok := err.(*models.AppError); ok {
		appErr = ae
	} else {
		appErr = models.NewInternalError(err.Error())
	}
	
	// Add context to error
	appErr.WithRequestID(requestID).WithUserID(userID)
	
	// Create log context
	logCtx := services.LogContext{
		RequestID:      requestID,
		UserID:         userID,
		UserEmail:      c.GetString("userEmail"),
		OrganizationID: c.GetString("organizationId"),
		Method:         c.Request.Method,
		Path:           c.Request.URL.Path,
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
		Component:      "handler",
		Operation:      operation,
		ErrorCategory:  appErr.Category,
	}
	
	// Log the error
	if ehu.serviceManager.LoggingService != nil {
		ehu.serviceManager.LoggingService.LogError(logCtx, appErr, "Handler operation failed")
	}
	
	// Report to external service if enabled
	if ehu.serviceManager.ErrorReportingService != nil && ehu.serviceManager.ErrorReportingService.IsEnabled() {
		reportCtx := services.ErrorReportContext{
			RequestID:      requestID,
			UserID:         userID,
			UserEmail:      c.GetString("userEmail"),
			OrganizationID: c.GetString("organizationId"),
			Method:         c.Request.Method,
			Path:           c.Request.URL.Path,
			IPAddress:      c.ClientIP(),
			UserAgent:      c.Request.UserAgent(),
		}
		go ehu.serviceManager.ErrorReportingService.ReportError(c.Request.Context(), appErr, reportCtx)
	}
	
	// Return error response
	c.JSON(appErr.StatusCode, models.NewErrorResponse(appErr, requestID))
}

// HandleValidationError handles validation errors specifically
func (ehu *ErrorHandlerUtils) HandleValidationError(c *gin.Context, err error, details map[string]interface{}) {
	appErr := models.NewValidationError("Request validation failed", details)
	ehu.HandleError(c, appErr, "validation")
}

// HandleDatabaseError handles database errors with retry logic
func (ehu *ErrorHandlerUtils) HandleDatabaseError(c *gin.Context, err error, operation string) {
	appErr := models.NewDatabaseError(err.Error())
	ehu.HandleError(c, appErr, operation)
}

// HandleExternalServiceError handles external service errors
func (ehu *ErrorHandlerUtils) HandleExternalServiceError(c *gin.Context, service string, err error, operation string) {
	appErr := models.NewExternalServiceError(service, err.Error())
	ehu.HandleError(c, appErr, operation)
}

// ExecuteWithRetry executes a function with retry logic and proper error handling
func (ehu *ErrorHandlerUtils) ExecuteWithRetry(c *gin.Context, serviceName string, operation string, fn services.RetryableFunc) error {
	result := ehu.serviceManager.ExecuteWithRetryAndCircuitBreaker(c.Request.Context(), serviceName, fn)
	
	if !result.Success {
		// Log retry statistics
		if ehu.serviceManager.LoggingService != nil {
			logCtx := services.LogContext{
				RequestID:      c.GetString("requestID"),
				UserID:         c.GetString("userID"),
				Method:         c.Request.Method,
				Path:           c.Request.URL.Path,
				Component:      "retry",
				Operation:      operation,
				Metadata: map[string]interface{}{
					"service_name":  serviceName,
					"attempts":      result.Attempts,
					"total_delay":   result.TotalDelay.Milliseconds(),
				},
			}
			ehu.serviceManager.LoggingService.Warn(logCtx, "Operation failed after retries")
		}
		
		return result.LastError
	}
	
	return nil
}

// LogSecurityEvent logs security-related events
func (ehu *ErrorHandlerUtils) LogSecurityEvent(c *gin.Context, eventType, description, severity string) {
	if ehu.serviceManager.LoggingService == nil {
		return
	}
	
	logCtx := services.LogContext{
		RequestID:      c.GetString("requestID"),
		UserID:         c.GetString("userID"),
		UserEmail:      c.GetString("userEmail"),
		OrganizationID: c.GetString("organizationId"),
		Method:         c.Request.Method,
		Path:           c.Request.URL.Path,
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
		Component:      "security",
	}
	
	ehu.serviceManager.LoggingService.LogSecurityEvent(logCtx, eventType, description, severity)
}

// LogAuditEvent logs audit events
func (ehu *ErrorHandlerUtils) LogAuditEvent(c *gin.Context, action, resource string, changes map[string]interface{}) {
	if ehu.serviceManager.LoggingService == nil {
		return
	}
	
	logCtx := services.LogContext{
		RequestID:      c.GetString("requestID"),
		UserID:         c.GetString("userID"),
		UserEmail:      c.GetString("userEmail"),
		OrganizationID: c.GetString("organizationId"),
		Method:         c.Request.Method,
		Path:           c.Request.URL.Path,
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
		Component:      "audit",
	}
	
	ehu.serviceManager.LoggingService.LogAuditEvent(logCtx, action, resource, changes)
}

// RespondWithSuccess sends a successful response
func (ehu *ErrorHandlerUtils) RespondWithSuccess(c *gin.Context, data interface{}) {
	requestID := c.GetString("requestID")
	
	response := models.ApiResponse{
		Success:   true,
		Data:      data,
		RequestID: requestID,
	}
	
	c.JSON(http.StatusOK, response)
}

// RespondWithCreated sends a created response
func (ehu *ErrorHandlerUtils) RespondWithCreated(c *gin.Context, data interface{}) {
	requestID := c.GetString("requestID")
	
	response := models.ApiResponse{
		Success:   true,
		Data:      data,
		RequestID: requestID,
	}
	
	c.JSON(http.StatusCreated, response)
}