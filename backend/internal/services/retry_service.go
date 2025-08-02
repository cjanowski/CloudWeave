package services

import (
	"context"
	"math"
	"math/rand"
	"time"

	"cloudweave/internal/models"
)

// RetryService provides retry logic with exponential backoff and circuit breaker
type RetryService struct {
	config RetryConfig
}

// RetryConfig contains configuration for retry behavior
type RetryConfig struct {
	MaxAttempts      int
	InitialDelay     time.Duration
	MaxDelay         time.Duration
	BackoffMultiplier float64
	JitterEnabled    bool
}

// RetryableFunc represents a function that can be retried
type RetryableFunc func(ctx context.Context) error

// RetryResult contains the result of a retry operation
type RetryResult struct {
	Success      bool
	Attempts     int
	TotalDelay   time.Duration
	LastError    error
	FinalResult  interface{}
}

// CircuitBreakerState represents the state of a circuit breaker
type CircuitBreakerState int

const (
	CircuitBreakerClosed CircuitBreakerState = iota
	CircuitBreakerOpen
	CircuitBreakerHalfOpen
)

// CircuitBreaker implements the circuit breaker pattern
type CircuitBreaker struct {
	name           string
	state          CircuitBreakerState
	failureCount   int
	successCount   int
	lastFailureTime time.Time
	config         CircuitBreakerConfig
}

// CircuitBreakerConfig contains configuration for circuit breaker
type CircuitBreakerConfig struct {
	FailureThreshold int
	RecoveryTimeout  time.Duration
	SuccessThreshold int
}

// NewRetryService creates a new retry service
func NewRetryService(config RetryConfig) *RetryService {
	if config.MaxAttempts == 0 {
		config.MaxAttempts = 3
	}
	if config.InitialDelay == 0 {
		config.InitialDelay = 100 * time.Millisecond
	}
	if config.MaxDelay == 0 {
		config.MaxDelay = 30 * time.Second
	}
	if config.BackoffMultiplier == 0 {
		config.BackoffMultiplier = 2.0
	}

	return &RetryService{
		config: config,
	}
}

// Execute executes a function with retry logic
func (rs *RetryService) Execute(ctx context.Context, fn RetryableFunc) *RetryResult {
	result := &RetryResult{
		Success:    false,
		Attempts:   0,
		TotalDelay: 0,
	}

	for attempt := 1; attempt <= rs.config.MaxAttempts; attempt++ {
		result.Attempts = attempt

		// Execute the function
		err := fn(ctx)
		if err == nil {
			result.Success = true
			return result
		}

		result.LastError = err

		// Check if error is retryable
		if !rs.isRetryableError(err) {
			break
		}

		// Don't delay after the last attempt
		if attempt < rs.config.MaxAttempts {
			delay := rs.calculateDelay(attempt)
			result.TotalDelay += delay

			// Check if context is cancelled
			select {
			case <-ctx.Done():
				result.LastError = ctx.Err()
				return result
			case <-time.After(delay):
				// Continue to next attempt
			}
		}
	}

	return result
}

// ExecuteWithFallback executes a function with retry logic and fallback
func (rs *RetryService) ExecuteWithFallback(ctx context.Context, fn RetryableFunc, fallback RetryableFunc) *RetryResult {
	result := rs.Execute(ctx, fn)
	
	if !result.Success && fallback != nil {
		// Try fallback function
		fallbackErr := fallback(ctx)
		if fallbackErr == nil {
			result.Success = true
			result.LastError = nil
		} else {
			// Keep original error but note fallback also failed
			if appErr, ok := result.LastError.(*models.AppError); ok {
				appErr.WithDetails("fallback_error", fallbackErr.Error())
			}
		}
	}

	return result
}

// calculateDelay calculates the delay for the next retry attempt
func (rs *RetryService) calculateDelay(attempt int) time.Duration {
	delay := float64(rs.config.InitialDelay) * math.Pow(rs.config.BackoffMultiplier, float64(attempt-1))
	
	// Apply jitter if enabled
	if rs.config.JitterEnabled {
		jitter := rand.Float64() * 0.1 // 10% jitter
		delay = delay * (1 + jitter)
	}
	
	// Cap at max delay
	if time.Duration(delay) > rs.config.MaxDelay {
		delay = float64(rs.config.MaxDelay)
	}
	
	return time.Duration(delay)
}

// isRetryableError determines if an error is retryable
func (rs *RetryService) isRetryableError(err error) bool {
	if appErr, ok := err.(*models.AppError); ok {
		return appErr.Retryable
	}
	
	// Default to retryable for unknown errors
	return true
}

// NewCircuitBreaker creates a new circuit breaker
func NewCircuitBreaker(name string, config CircuitBreakerConfig) *CircuitBreaker {
	if config.FailureThreshold == 0 {
		config.FailureThreshold = 5
	}
	if config.RecoveryTimeout == 0 {
		config.RecoveryTimeout = 60 * time.Second
	}
	if config.SuccessThreshold == 0 {
		config.SuccessThreshold = 3
	}

	return &CircuitBreaker{
		name:   name,
		state:  CircuitBreakerClosed,
		config: config,
	}
}

// Execute executes a function through the circuit breaker
func (cb *CircuitBreaker) Execute(ctx context.Context, fn RetryableFunc) error {
	if !cb.canExecute() {
		return models.NewExternalServiceError(cb.name, "Circuit breaker is open")
	}

	err := fn(ctx)
	cb.recordResult(err == nil)
	
	return err
}

// canExecute determines if the circuit breaker allows execution
func (cb *CircuitBreaker) canExecute() bool {
	switch cb.state {
	case CircuitBreakerClosed:
		return true
	case CircuitBreakerOpen:
		// Check if recovery timeout has passed
		if time.Since(cb.lastFailureTime) > cb.config.RecoveryTimeout {
			cb.state = CircuitBreakerHalfOpen
			cb.successCount = 0
			return true
		}
		return false
	case CircuitBreakerHalfOpen:
		return true
	default:
		return false
	}
}

// recordResult records the result of an execution
func (cb *CircuitBreaker) recordResult(success bool) {
	if success {
		cb.successCount++
		cb.failureCount = 0
		
		if cb.state == CircuitBreakerHalfOpen && cb.successCount >= cb.config.SuccessThreshold {
			cb.state = CircuitBreakerClosed
		}
	} else {
		cb.failureCount++
		cb.successCount = 0
		cb.lastFailureTime = time.Now()
		
		if cb.failureCount >= cb.config.FailureThreshold {
			cb.state = CircuitBreakerOpen
		}
	}
}

// GetState returns the current state of the circuit breaker
func (cb *CircuitBreaker) GetState() CircuitBreakerState {
	return cb.state
}

// GetStats returns statistics about the circuit breaker
func (cb *CircuitBreaker) GetStats() map[string]interface{} {
	return map[string]interface{}{
		"name":              cb.name,
		"state":             cb.getStateString(),
		"failure_count":     cb.failureCount,
		"success_count":     cb.successCount,
		"last_failure_time": cb.lastFailureTime,
		"failure_threshold": cb.config.FailureThreshold,
		"recovery_timeout":  cb.config.RecoveryTimeout,
		"success_threshold": cb.config.SuccessThreshold,
	}
}

// getStateString returns the string representation of the circuit breaker state
func (cb *CircuitBreaker) getStateString() string {
	switch cb.state {
	case CircuitBreakerClosed:
		return "closed"
	case CircuitBreakerOpen:
		return "open"
	case CircuitBreakerHalfOpen:
		return "half-open"
	default:
		return "unknown"
	}
}

// RetryWithCircuitBreaker combines retry logic with circuit breaker
func RetryWithCircuitBreaker(ctx context.Context, retryService *RetryService, circuitBreaker *CircuitBreaker, fn RetryableFunc) *RetryResult {
	wrappedFn := func(ctx context.Context) error {
		return circuitBreaker.Execute(ctx, fn)
	}
	
	return retryService.Execute(ctx, wrappedFn)
}

// DefaultRetryConfig returns a default retry configuration
func DefaultRetryConfig() RetryConfig {
	return RetryConfig{
		MaxAttempts:       3,
		InitialDelay:      100 * time.Millisecond,
		MaxDelay:          30 * time.Second,
		BackoffMultiplier: 2.0,
		JitterEnabled:     true,
	}
}

// DefaultCircuitBreakerConfig returns a default circuit breaker configuration
func DefaultCircuitBreakerConfig() CircuitBreakerConfig {
	return CircuitBreakerConfig{
		FailureThreshold: 5,
		RecoveryTimeout:  60 * time.Second,
		SuccessThreshold: 3,
	}
}

// ExponentialBackoffRetryConfig returns a configuration for exponential backoff
func ExponentialBackoffRetryConfig() RetryConfig {
	return RetryConfig{
		MaxAttempts:       5,
		InitialDelay:      200 * time.Millisecond,
		MaxDelay:          60 * time.Second,
		BackoffMultiplier: 2.5,
		JitterEnabled:     true,
	}
}

// QuickRetryConfig returns a configuration for quick retries
func QuickRetryConfig() RetryConfig {
	return RetryConfig{
		MaxAttempts:       2,
		InitialDelay:      50 * time.Millisecond,
		MaxDelay:          500 * time.Millisecond,
		BackoffMultiplier: 2.0,
		JitterEnabled:     false,
	}
}