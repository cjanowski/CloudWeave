package models

import (
	"fmt"
	"runtime"
	"time"
)

// AppError represents a comprehensive application error with context
type AppError struct {
	Code       string                 `json:"code"`
	Message    string                 `json:"message"`
	Details    map[string]interface{} `json:"details,omitempty"`
	StatusCode int                    `json:"-"`
	Timestamp  time.Time              `json:"timestamp"`
	RequestID  string                 `json:"requestId,omitempty"`
	UserID     string                 `json:"-"` // For logging, not exposed to client
	Stack      string                 `json:"-"` // For logging, not exposed to client
	Category   ErrorCategory          `json:"category,omitempty"`
	Retryable  bool                   `json:"retryable,omitempty"`
}

// ErrorCategory represents different types of errors for better handling
type ErrorCategory string

const (
	ErrorCategoryValidation     ErrorCategory = "VALIDATION"
	ErrorCategoryAuthentication ErrorCategory = "AUTHENTICATION"
	ErrorCategoryAuthorization  ErrorCategory = "AUTHORIZATION"
	ErrorCategoryDatabase       ErrorCategory = "DATABASE"
	ErrorCategoryExternal       ErrorCategory = "EXTERNAL_SERVICE"
	ErrorCategoryInternal       ErrorCategory = "INTERNAL"
	ErrorCategoryRateLimit      ErrorCategory = "RATE_LIMIT"
	ErrorCategoryNotFound       ErrorCategory = "NOT_FOUND"
	ErrorCategoryConflict       ErrorCategory = "CONFLICT"
	ErrorCategoryTimeout        ErrorCategory = "TIMEOUT"
)

// Error implements the error interface
func (e *AppError) Error() string {
	return e.Message
}

// WithDetails adds additional details to the error
func (e *AppError) WithDetails(key string, value interface{}) *AppError {
	if e.Details == nil {
		e.Details = make(map[string]interface{})
	}
	e.Details[key] = value
	return e
}

// WithRequestID adds request ID to the error
func (e *AppError) WithRequestID(requestID string) *AppError {
	e.RequestID = requestID
	return e
}

// WithUserID adds user ID to the error (for logging)
func (e *AppError) WithUserID(userID string) *AppError {
	e.UserID = userID
	return e
}

// WithStack captures the current stack trace
func (e *AppError) WithStack() *AppError {
	buf := make([]byte, 1024)
	n := runtime.Stack(buf, false)
	e.Stack = string(buf[:n])
	return e
}

// NewAppError creates a new application error
func NewAppError(code, message string, statusCode int, category ErrorCategory) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		StatusCode: statusCode,
		Category:   category,
		Timestamp:  time.Now(),
		Retryable:  false,
	}
}

// Predefined error constructors for common scenarios

// NewValidationError creates a validation error
func NewValidationError(message string, details map[string]interface{}) *AppError {
	return &AppError{
		Code:       "VALIDATION_ERROR",
		Message:    message,
		Details:    details,
		StatusCode: 400,
		Category:   ErrorCategoryValidation,
		Timestamp:  time.Now(),
		Retryable:  false,
	}
}

// NewAuthenticationError creates an authentication error
func NewAuthenticationError(message string) *AppError {
	return &AppError{
		Code:       "AUTHENTICATION_ERROR",
		Message:    message,
		StatusCode: 401,
		Category:   ErrorCategoryAuthentication,
		Timestamp:  time.Now(),
		Retryable:  false,
	}
}

// NewAuthorizationError creates an authorization error
func NewAuthorizationError(message string) *AppError {
	return &AppError{
		Code:       "AUTHORIZATION_ERROR",
		Message:    message,
		StatusCode: 403,
		Category:   ErrorCategoryAuthorization,
		Timestamp:  time.Now(),
		Retryable:  false,
	}
}

// NewNotFoundError creates a not found error
func NewNotFoundError(resource string) *AppError {
	return &AppError{
		Code:       "NOT_FOUND",
		Message:    fmt.Sprintf("%s not found", resource),
		StatusCode: 404,
		Category:   ErrorCategoryNotFound,
		Timestamp:  time.Now(),
		Retryable:  false,
	}
}

// NewConflictError creates a conflict error
func NewConflictError(message string) *AppError {
	return &AppError{
		Code:       "CONFLICT",
		Message:    message,
		StatusCode: 409,
		Category:   ErrorCategoryConflict,
		Timestamp:  time.Now(),
		Retryable:  false,
	}
}

// NewDatabaseError creates a database error
func NewDatabaseError(message string) *AppError {
	return &AppError{
		Code:       "DATABASE_ERROR",
		Message:    "Database operation failed",
		Details:    map[string]interface{}{"internal_message": message},
		StatusCode: 500,
		Category:   ErrorCategoryDatabase,
		Timestamp:  time.Now(),
		Retryable:  true,
	}
}

// NewExternalServiceError creates an external service error
func NewExternalServiceError(service, message string) *AppError {
	return &AppError{
		Code:       "EXTERNAL_SERVICE_ERROR",
		Message:    fmt.Sprintf("External service '%s' is unavailable", service),
		Details:    map[string]interface{}{"service": service, "internal_message": message},
		StatusCode: 502,
		Category:   ErrorCategoryExternal,
		Timestamp:  time.Now(),
		Retryable:  true,
	}
}

// NewTimeoutError creates a timeout error
func NewTimeoutError(operation string) *AppError {
	return &AppError{
		Code:       "TIMEOUT_ERROR",
		Message:    fmt.Sprintf("Operation '%s' timed out", operation),
		Details:    map[string]interface{}{"operation": operation},
		StatusCode: 504,
		Category:   ErrorCategoryTimeout,
		Timestamp:  time.Now(),
		Retryable:  true,
	}
}

// NewRateLimitError creates a rate limit error
func NewRateLimitError(message string) *AppError {
	return &AppError{
		Code:       "RATE_LIMIT_EXCEEDED",
		Message:    message,
		StatusCode: 429,
		Category:   ErrorCategoryRateLimit,
		Timestamp:  time.Now(),
		Retryable:  true,
	}
}

// NewInternalError creates an internal server error
func NewInternalError(message string) *AppError {
	err := &AppError{
		Code:       "INTERNAL_ERROR",
		Message:    "An internal server error occurred",
		Details:    map[string]interface{}{"internal_message": message},
		StatusCode: 500,
		Category:   ErrorCategoryInternal,
		Timestamp:  time.Now(),
		Retryable:  false,
	}
	return err.WithStack()
}

// ErrorResponse represents the standardized error response format
type ErrorResponse struct {
	Success   bool      `json:"success"`
	Error     *AppError `json:"error"`
	RequestID string    `json:"requestId,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// NewErrorResponse creates a standardized error response
func NewErrorResponse(err *AppError, requestID string) *ErrorResponse {
	return &ErrorResponse{
		Success:   false,
		Error:     err,
		RequestID: requestID,
		Timestamp: time.Now(),
	}
}