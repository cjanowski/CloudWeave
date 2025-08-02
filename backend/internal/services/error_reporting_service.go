package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"runtime"
	"sync"
	"time"

	"cloudweave/internal/models"
)

// ErrorReportingService handles error reporting to external services
type ErrorReportingService struct {
	config        ErrorReportingConfig
	httpClient    *http.Client
	errorBuffer   []ErrorReport
	bufferMutex   sync.RWMutex
	flushInterval time.Duration
	maxBufferSize int
	enabled       bool
}

// ErrorReportingConfig contains configuration for error reporting
type ErrorReportingConfig struct {
	ServiceURL    string
	APIKey        string
	Environment   string
	ServiceName   string
	ServiceVersion string
	Enabled       bool
}

// ErrorReport represents an error report to be sent to external service
type ErrorReport struct {
	ID            string                 `json:"id"`
	Timestamp     time.Time              `json:"timestamp"`
	Environment   string                 `json:"environment"`
	ServiceName   string                 `json:"service_name"`
	ServiceVersion string                `json:"service_version"`
	Error         *models.AppError       `json:"error"`
	Context       ErrorReportContext     `json:"context"`
	ServerInfo    ServerInfo             `json:"server_info"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

// ErrorReportContext contains contextual information about the error
type ErrorReportContext struct {
	RequestID      string            `json:"request_id,omitempty"`
	UserID         string            `json:"user_id,omitempty"`
	UserEmail      string            `json:"user_email,omitempty"`
	OrganizationID string            `json:"organization_id,omitempty"`
	Method         string            `json:"method,omitempty"`
	Path           string            `json:"path,omitempty"`
	IPAddress      string            `json:"ip_address,omitempty"`
	UserAgent      string            `json:"user_agent,omitempty"`
	Headers        map[string]string `json:"headers,omitempty"`
	QueryParams    map[string]string `json:"query_params,omitempty"`
}

// ServerInfo contains information about the server environment
type ServerInfo struct {
	Hostname     string `json:"hostname"`
	Platform     string `json:"platform"`
	Architecture string `json:"architecture"`
	GoVersion    string `json:"go_version"`
	NumCPU       int    `json:"num_cpu"`
	NumGoroutine int    `json:"num_goroutine"`
}

// NewErrorReportingService creates a new error reporting service
func NewErrorReportingService() *ErrorReportingService {
	config := ErrorReportingConfig{
		ServiceURL:     os.Getenv("ERROR_REPORTING_URL"),
		APIKey:         os.Getenv("ERROR_REPORTING_API_KEY"),
		Environment:    getEnvOrDefault("ENVIRONMENT", "development"),
		ServiceName:    getEnvOrDefault("SERVICE_NAME", "cloudweave"),
		ServiceVersion: getEnvOrDefault("SERVICE_VERSION", "1.0.0"),
		Enabled:        os.Getenv("ERROR_REPORTING_ENABLED") == "true",
	}

	service := &ErrorReportingService{
		config: config,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		errorBuffer:   make([]ErrorReport, 0),
		flushInterval: 30 * time.Second,
		maxBufferSize: 100,
		enabled:       config.Enabled && config.ServiceURL != "" && config.APIKey != "",
	}

	if service.enabled {
		// Start background goroutine to flush errors periodically
		go service.startPeriodicFlush()
	}

	return service
}

// ReportError reports an error to the external service
func (ers *ErrorReportingService) ReportError(ctx context.Context, appErr *models.AppError, reportCtx ErrorReportContext) error {
	if !ers.enabled {
		return nil
	}

	report := ErrorReport{
		ID:             generateReportID(),
		Timestamp:      time.Now(),
		Environment:    ers.config.Environment,
		ServiceName:    ers.config.ServiceName,
		ServiceVersion: ers.config.ServiceVersion,
		Error:          appErr,
		Context:        reportCtx,
		ServerInfo:     ers.getServerInfo(),
	}

	// Add to buffer for batch processing
	ers.bufferMutex.Lock()
	ers.errorBuffer = append(ers.errorBuffer, report)
	shouldFlush := len(ers.errorBuffer) >= ers.maxBufferSize
	ers.bufferMutex.Unlock()

	// Flush immediately if buffer is full
	if shouldFlush {
		go ers.flushErrors()
	}

	return nil
}

// ReportPanic reports a panic to the external service
func (ers *ErrorReportingService) ReportPanic(ctx context.Context, recovered interface{}, reportCtx ErrorReportContext) error {
	if !ers.enabled {
		return nil
	}

	// Create AppError from panic
	appErr := &models.AppError{
		Code:       "PANIC",
		Message:    fmt.Sprintf("Panic occurred: %v", recovered),
		StatusCode: 500,
		Category:   models.ErrorCategoryInternal,
		Timestamp:  time.Now(),
		Retryable:  false,
	}

	// Capture stack trace
	buf := make([]byte, 4096)
	n := runtime.Stack(buf, false)
	appErr.Stack = string(buf[:n])

	return ers.ReportError(ctx, appErr, reportCtx)
}

// flushErrors sends buffered errors to the external service
func (ers *ErrorReportingService) flushErrors() error {
	if !ers.enabled {
		return nil
	}

	ers.bufferMutex.Lock()
	if len(ers.errorBuffer) == 0 {
		ers.bufferMutex.Unlock()
		return nil
	}

	// Copy buffer and clear it
	reports := make([]ErrorReport, len(ers.errorBuffer))
	copy(reports, ers.errorBuffer)
	ers.errorBuffer = ers.errorBuffer[:0]
	ers.bufferMutex.Unlock()

	// Send reports to external service
	return ers.sendReports(reports)
}

// sendReports sends error reports to the external service
func (ers *ErrorReportingService) sendReports(reports []ErrorReport) error {
	if len(reports) == 0 {
		return nil
	}

	payload := map[string]interface{}{
		"errors": reports,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal error reports: %w", err)
	}

	req, err := http.NewRequest("POST", ers.config.ServiceURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+ers.config.APIKey)
	req.Header.Set("User-Agent", fmt.Sprintf("%s/%s", ers.config.ServiceName, ers.config.ServiceVersion))

	resp, err := ers.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send error reports: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("error reporting service returned status %d", resp.StatusCode)
	}

	return nil
}

// startPeriodicFlush starts a goroutine that periodically flushes errors
func (ers *ErrorReportingService) startPeriodicFlush() {
	ticker := time.NewTicker(ers.flushInterval)
	defer ticker.Stop()

	for range ticker.C {
		if err := ers.flushErrors(); err != nil {
			// Log error but don't fail - error reporting is not critical
			fmt.Printf("Failed to flush error reports: %v\n", err)
		}
	}
}

// getServerInfo collects server information
func (ers *ErrorReportingService) getServerInfo() ServerInfo {
	hostname, _ := os.Hostname()
	
	return ServerInfo{
		Hostname:     hostname,
		Platform:     runtime.GOOS,
		Architecture: runtime.GOARCH,
		GoVersion:    runtime.Version(),
		NumCPU:       runtime.NumCPU(),
		NumGoroutine: runtime.NumGoroutine(),
	}
}

// Close gracefully shuts down the error reporting service
func (ers *ErrorReportingService) Close() error {
	if !ers.enabled {
		return nil
	}

	// Flush any remaining errors
	return ers.flushErrors()
}

// IsEnabled returns whether error reporting is enabled
func (ers *ErrorReportingService) IsEnabled() bool {
	return ers.enabled
}

// GetStats returns statistics about error reporting
func (ers *ErrorReportingService) GetStats() map[string]interface{} {
	ers.bufferMutex.RLock()
	bufferSize := len(ers.errorBuffer)
	ers.bufferMutex.RUnlock()

	return map[string]interface{}{
		"enabled":           ers.enabled,
		"buffer_size":       bufferSize,
		"max_buffer_size":   ers.maxBufferSize,
		"flush_interval_ms": ers.flushInterval.Milliseconds(),
		"service_url":       ers.config.ServiceURL,
		"environment":       ers.config.Environment,
	}
}

// Helper functions

func generateReportID() string {
	return fmt.Sprintf("err_%d_%d", time.Now().UnixNano(), runtime.NumGoroutine())
}

