package services

import (
	"context"
	"sync"
)

// ServiceManager coordinates all application services
type ServiceManager struct {
	LoggingService       *LoggingService
	ErrorReportingService *ErrorReportingService
	RetryService         *RetryService
	CircuitBreakers      map[string]*CircuitBreaker
	mutex                sync.RWMutex
}

// NewServiceManager creates a new service manager
func NewServiceManager() *ServiceManager {
	return &ServiceManager{
		LoggingService:        NewLoggingService(),
		ErrorReportingService: NewErrorReportingService(),
		RetryService:          NewRetryService(DefaultRetryConfig()),
		CircuitBreakers:       make(map[string]*CircuitBreaker),
	}
}

// GetCircuitBreaker gets or creates a circuit breaker for a service
func (sm *ServiceManager) GetCircuitBreaker(serviceName string) *CircuitBreaker {
	sm.mutex.RLock()
	cb, exists := sm.CircuitBreakers[serviceName]
	sm.mutex.RUnlock()
	
	if exists {
		return cb
	}
	
	sm.mutex.Lock()
	defer sm.mutex.Unlock()
	
	// Double-check after acquiring write lock
	if cb, exists := sm.CircuitBreakers[serviceName]; exists {
		return cb
	}
	
	// Create new circuit breaker
	cb = NewCircuitBreaker(serviceName, DefaultCircuitBreakerConfig())
	sm.CircuitBreakers[serviceName] = cb
	
	return cb
}

// ExecuteWithRetryAndCircuitBreaker executes a function with both retry and circuit breaker
func (sm *ServiceManager) ExecuteWithRetryAndCircuitBreaker(ctx context.Context, serviceName string, fn RetryableFunc) *RetryResult {
	cb := sm.GetCircuitBreaker(serviceName)
	return RetryWithCircuitBreaker(ctx, sm.RetryService, cb, fn)
}

// GetServiceStats returns statistics for all services
func (sm *ServiceManager) GetServiceStats() map[string]interface{} {
	sm.mutex.RLock()
	defer sm.mutex.RUnlock()
	
	stats := map[string]interface{}{
		"logging_enabled":       sm.LoggingService != nil,
		"error_reporting_stats": sm.ErrorReportingService.GetStats(),
		"circuit_breakers":      make(map[string]interface{}),
	}
	
	// Add circuit breaker stats
	cbStats := make(map[string]interface{})
	for name, cb := range sm.CircuitBreakers {
		cbStats[name] = cb.GetStats()
	}
	stats["circuit_breakers"] = cbStats
	
	return stats
}

// Close gracefully shuts down all services
func (sm *ServiceManager) Close() error {
	if sm.ErrorReportingService != nil {
		return sm.ErrorReportingService.Close()
	}
	return nil
}