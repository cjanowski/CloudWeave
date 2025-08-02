package services

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"cloudweave/internal/models"

	"github.com/sirupsen/logrus"
)

// LoggingService provides structured logging with context
type LoggingService struct {
	logger *logrus.Logger
}

// LogLevel represents different log levels
type LogLevel string

const (
	LogLevelDebug LogLevel = "debug"
	LogLevelInfo  LogLevel = "info"
	LogLevelWarn  LogLevel = "warn"
	LogLevelError LogLevel = "error"
	LogLevelFatal LogLevel = "fatal"
)

// LogContext contains contextual information for logging
type LogContext struct {
	RequestID      string
	UserID         string
	UserEmail      string
	OrganizationID string
	Method         string
	Path           string
	IPAddress      string
	UserAgent      string
	Component      string
	Operation      string
	Duration       time.Duration
	StatusCode     int
	ErrorCategory  models.ErrorCategory
	Metadata       map[string]interface{}
}

// NewLoggingService creates a new logging service
func NewLoggingService() *LoggingService {
	logger := logrus.New()
	
	// Configure logger based on environment
	env := os.Getenv("ENVIRONMENT")
	if env == "production" {
		logger.SetLevel(logrus.InfoLevel)
		logger.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: time.RFC3339,
			FieldMap: logrus.FieldMap{
				logrus.FieldKeyTime:  "timestamp",
				logrus.FieldKeyLevel: "level",
				logrus.FieldKeyMsg:   "message",
				logrus.FieldKeyFunc:  "function",
				logrus.FieldKeyFile:  "file",
			},
		})
	} else {
		logger.SetLevel(logrus.DebugLevel)
		logger.SetFormatter(&logrus.TextFormatter{
			TimestampFormat: "2006-01-02 15:04:05",
			FullTimestamp:   true,
			ForceColors:     true,
		})
	}
	
	// Set output to stdout for containerized environments
	logger.SetOutput(os.Stdout)
	
	// Add caller information
	logger.SetReportCaller(true)
	
	return &LoggingService{
		logger: logger,
	}
}

// WithContext creates a logger entry with context
func (ls *LoggingService) WithContext(ctx LogContext) *logrus.Entry {
	entry := ls.logger.WithFields(logrus.Fields{
		"request_id":      ctx.RequestID,
		"user_id":         ctx.UserID,
		"user_email":      ctx.UserEmail,
		"organization_id": ctx.OrganizationID,
		"method":          ctx.Method,
		"path":            ctx.Path,
		"ip_address":      ctx.IPAddress,
		"user_agent":      ctx.UserAgent,
		"component":       ctx.Component,
		"operation":       ctx.Operation,
		"status_code":     ctx.StatusCode,
		"error_category":  ctx.ErrorCategory,
	})
	
	if ctx.Duration > 0 {
		entry = entry.WithField("duration_ms", ctx.Duration.Milliseconds())
	}
	
	// Add metadata if present
	if ctx.Metadata != nil {
		for key, value := range ctx.Metadata {
			entry = entry.WithField(key, value)
		}
	}
	
	return entry
}

// LogRequest logs HTTP request information
func (ls *LoggingService) LogRequest(ctx LogContext, message string) {
	ls.WithContext(ctx).Info(message)
}

// LogError logs error information with full context
func (ls *LoggingService) LogError(ctx LogContext, err error, message string) {
	entry := ls.WithContext(ctx)
	
	if appErr, ok := err.(*models.AppError); ok {
		entry = entry.WithFields(logrus.Fields{
			"error_code":     appErr.Code,
			"error_category": appErr.Category,
			"retryable":      appErr.Retryable,
			"stack_trace":    appErr.Stack,
		})
		
		if appErr.Details != nil {
			entry = entry.WithField("error_details", appErr.Details)
		}
	} else {
		entry = entry.WithField("error", err.Error())
	}
	
	entry.Error(message)
}

// LogPanic logs panic information with stack trace
func (ls *LoggingService) LogPanic(ctx LogContext, recovered interface{}, message string) {
	// Capture stack trace
	buf := make([]byte, 4096)
	n := runtime.Stack(buf, false)
	stackTrace := string(buf[:n])
	
	ls.WithContext(ctx).WithFields(logrus.Fields{
		"panic_value":  recovered,
		"stack_trace":  stackTrace,
	}).Fatal(message)
}

// LogDatabaseOperation logs database operations
func (ls *LoggingService) LogDatabaseOperation(ctx LogContext, operation, table string, duration time.Duration, err error) {
	entry := ls.WithContext(ctx).WithFields(logrus.Fields{
		"db_operation":   operation,
		"db_table":       table,
		"duration_ms":    duration.Milliseconds(),
	})
	
	if err != nil {
		entry.WithField("error", err.Error()).Error("Database operation failed")
	} else {
		entry.Debug("Database operation completed")
	}
}

// LogExternalServiceCall logs external service calls
func (ls *LoggingService) LogExternalServiceCall(ctx LogContext, service, endpoint string, duration time.Duration, statusCode int, err error) {
	entry := ls.WithContext(ctx).WithFields(logrus.Fields{
		"external_service": service,
		"endpoint":         endpoint,
		"duration_ms":      duration.Milliseconds(),
		"status_code":      statusCode,
	})
	
	if err != nil {
		entry.WithField("error", err.Error()).Error("External service call failed")
	} else {
		entry.Info("External service call completed")
	}
}

// LogSecurityEvent logs security-related events
func (ls *LoggingService) LogSecurityEvent(ctx LogContext, eventType, description string, severity string) {
	ls.WithContext(ctx).WithFields(logrus.Fields{
		"security_event_type": eventType,
		"severity":            severity,
		"description":         description,
	}).Warn("Security event detected")
}

// LogAuditEvent logs audit events
func (ls *LoggingService) LogAuditEvent(ctx LogContext, action, resource string, changes map[string]interface{}) {
	ls.WithContext(ctx).WithFields(logrus.Fields{
		"audit_action":   action,
		"audit_resource": resource,
		"changes":        changes,
	}).Info("Audit event recorded")
}

// LogPerformanceMetric logs performance metrics
func (ls *LoggingService) LogPerformanceMetric(ctx LogContext, metric string, value float64, unit string) {
	ls.WithContext(ctx).WithFields(logrus.Fields{
		"metric_name":  metric,
		"metric_value": value,
		"metric_unit":  unit,
	}).Info("Performance metric recorded")
}

// Debug logs debug information
func (ls *LoggingService) Debug(ctx LogContext, message string) {
	ls.WithContext(ctx).Debug(message)
}

// Info logs informational messages
func (ls *LoggingService) Info(ctx LogContext, message string) {
	ls.WithContext(ctx).Info(message)
}

// Warn logs warning messages
func (ls *LoggingService) Warn(ctx LogContext, message string) {
	ls.WithContext(ctx).Warn(message)
}

// Error logs error messages
func (ls *LoggingService) Error(ctx LogContext, message string) {
	ls.WithContext(ctx).Error(message)
}

// Fatal logs fatal messages and exits
func (ls *LoggingService) Fatal(ctx LogContext, message string) {
	ls.WithContext(ctx).Fatal(message)
}

// GetLogger returns the underlying logrus logger for advanced usage
func (ls *LoggingService) GetLogger() *logrus.Logger {
	return ls.logger
}

// SetLevel sets the logging level
func (ls *LoggingService) SetLevel(level LogLevel) {
	switch level {
	case LogLevelDebug:
		ls.logger.SetLevel(logrus.DebugLevel)
	case LogLevelInfo:
		ls.logger.SetLevel(logrus.InfoLevel)
	case LogLevelWarn:
		ls.logger.SetLevel(logrus.WarnLevel)
	case LogLevelError:
		ls.logger.SetLevel(logrus.ErrorLevel)
	case LogLevelFatal:
		ls.logger.SetLevel(logrus.FatalLevel)
	}
}

// CreateContextFromGin creates a LogContext from Gin context
func CreateLogContextFromGin(c interface{}) LogContext {
	// This would be implemented to extract context from Gin
	// For now, return empty context
	return LogContext{}
}

// SanitizeForLogging removes sensitive information from data before logging
func SanitizeForLogging(data map[string]interface{}) map[string]interface{} {
	sensitiveFields := []string{
		"password", "token", "secret", "key", "credential",
		"authorization", "cookie", "session", "private",
	}
	
	sanitized := make(map[string]interface{})
	for k, v := range data {
		key := strings.ToLower(k)
		isSensitive := false
		
		for _, sensitive := range sensitiveFields {
			if strings.Contains(key, sensitive) {
				isSensitive = true
				break
			}
		}
		
		if isSensitive {
			sanitized[k] = "[REDACTED]"
		} else {
			sanitized[k] = v
		}
	}
	
	return sanitized
}

// FormatCaller formats the caller information for logging
func FormatCaller(frame *runtime.Frame) string {
	return fmt.Sprintf("%s:%d %s", 
		filepath.Base(frame.File), 
		frame.Line, 
		filepath.Base(frame.Function))
}