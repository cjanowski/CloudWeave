package services

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"
)

// DeploymentOrchestrator manages the deployment lifecycle
type DeploymentOrchestrator struct {
	repoManager       *repositories.RepositoryManager
	activeDeployments map[string]*DeploymentExecution
	mutex             sync.RWMutex
}

// DeploymentExecution tracks a running deployment
type DeploymentExecution struct {
	ID          string
	Deployment  *models.Deployment
	Context     context.Context
	CancelFunc  context.CancelFunc
	Status      string
	Progress    int
	CurrentStep string
	StartTime   time.Time
	Logger      *DeploymentLogger
}

func NewDeploymentOrchestrator(repoManager *repositories.RepositoryManager) *DeploymentOrchestrator {
	return &DeploymentOrchestrator{
		repoManager:       repoManager,
		activeDeployments: make(map[string]*DeploymentExecution),
	}
}

// StartDeployment begins the deployment process
func (do *DeploymentOrchestrator) StartDeployment(ctx context.Context, deployment *models.Deployment) {
	// Create cancellable context for this deployment
	deployCtx, cancel := context.WithCancel(ctx)

	execution := &DeploymentExecution{
		ID:          deployment.ID,
		Deployment:  deployment,
		Context:     deployCtx,
		CancelFunc:  cancel,
		Status:      models.DeploymentStatusRunning,
		Progress:    0,
		CurrentStep: "initializing",
		StartTime:   time.Now(),
		Logger:      NewDeploymentLogger(do.repoManager),
	}

	// Track active deployment
	do.mutex.Lock()
	do.activeDeployments[deployment.ID] = execution
	do.mutex.Unlock()

	// Update deployment status to running
	deployment.Status = models.DeploymentStatusRunning
	now := time.Now()
	deployment.StartedAt = &now
	do.repoManager.Deployment.Update(ctx, deployment)

	// Start deployment process
	go do.executeDeployment(execution)
}

// executeDeployment runs the actual deployment steps
func (do *DeploymentOrchestrator) executeDeployment(execution *DeploymentExecution) {
	defer func() {
		// Clean up active deployment tracking
		do.mutex.Lock()
		delete(do.activeDeployments, execution.ID)
		do.mutex.Unlock()
	}()

	deployment := execution.Deployment
	logger := execution.Logger

	logger.LogInfo(execution.Context, deployment.ID, "Starting deployment", map[string]interface{}{
		"application": deployment.Application,
		"version":     deployment.Version,
		"environment": deployment.Environment,
	})

	// Deployment steps
	steps := []DeploymentStep{
		{Name: "validation", Duration: 2 * time.Second, Progress: 10},
		{Name: "preparation", Duration: 3 * time.Second, Progress: 25},
		{Name: "building", Duration: 10 * time.Second, Progress: 50},
		{Name: "testing", Duration: 5 * time.Second, Progress: 70},
		{Name: "deploying", Duration: 8 * time.Second, Progress: 90},
		{Name: "verification", Duration: 3 * time.Second, Progress: 100},
	}

	for _, step := range steps {
		select {
		case <-execution.Context.Done():
			// Deployment was cancelled
			logger.LogWarning(execution.Context, deployment.ID, "Deployment cancelled", map[string]interface{}{
				"step": step.Name,
			})
			do.updateDeploymentStatus(deployment, models.DeploymentStatusCancelled, execution.Progress)
			return
		default:
			// Execute step
			if err := do.executeStep(execution, step); err != nil {
				logger.LogError(execution.Context, deployment.ID, fmt.Sprintf("Step %s failed: %s", step.Name, err.Error()), map[string]interface{}{
					"step":  step.Name,
					"error": err.Error(),
				})
				do.updateDeploymentStatus(deployment, models.DeploymentStatusFailed, execution.Progress)
				return
			}
		}
	}

	// Deployment completed successfully
	logger.LogInfo(execution.Context, deployment.ID, "Deployment completed successfully", map[string]interface{}{
		"duration": time.Since(execution.StartTime).String(),
	})
	do.updateDeploymentStatus(deployment, models.DeploymentStatusCompleted, 100)
}

// DeploymentStep represents a step in the deployment process
type DeploymentStep struct {
	Name     string
	Duration time.Duration
	Progress int
}

// executeStep executes a single deployment step
func (do *DeploymentOrchestrator) executeStep(execution *DeploymentExecution, step DeploymentStep) error {
	execution.CurrentStep = step.Name
	execution.Logger.LogInfo(execution.Context, execution.ID, fmt.Sprintf("Starting step: %s", step.Name), map[string]interface{}{
		"step": step.Name,
	})

	// Simulate step execution with progress updates
	stepDuration := step.Duration
	progressIncrement := step.Progress - execution.Progress
	updateInterval := stepDuration / time.Duration(progressIncrement)

	for i := 0; i < progressIncrement; i++ {
		select {
		case <-execution.Context.Done():
			return fmt.Errorf("step cancelled")
		case <-time.After(updateInterval):
			execution.Progress++

			// Update deployment progress in database
			deployment := execution.Deployment
			deployment.Progress = execution.Progress
			do.repoManager.Deployment.Update(execution.Context, deployment)
		}
	}

	// Simulate occasional failures for testing
	if step.Name == "testing" && rand.Float32() < 0.1 { // 10% chance of test failure
		return fmt.Errorf("tests failed")
	}

	execution.Logger.LogInfo(execution.Context, execution.ID, fmt.Sprintf("Completed step: %s", step.Name), map[string]interface{}{
		"step":     step.Name,
		"progress": execution.Progress,
	})

	return nil
}

// updateDeploymentStatus updates the deployment status in the database
func (do *DeploymentOrchestrator) updateDeploymentStatus(deployment *models.Deployment, status string, progress int) {
	deployment.Status = status
	deployment.Progress = progress

	if status == models.DeploymentStatusCompleted || status == models.DeploymentStatusFailed || status == models.DeploymentStatusCancelled {
		now := time.Now()
		deployment.CompletedAt = &now
	}

	do.repoManager.Deployment.Update(context.Background(), deployment)
}

// CancelDeployment cancels a running deployment
func (do *DeploymentOrchestrator) CancelDeployment(ctx context.Context, deploymentID, reason string) error {
	do.mutex.RLock()
	execution, exists := do.activeDeployments[deploymentID]
	do.mutex.RUnlock()

	if !exists {
		return fmt.Errorf("deployment not found or not running")
	}

	execution.Logger.LogWarning(ctx, deploymentID, "Deployment cancellation requested", map[string]interface{}{
		"reason": reason,
	})

	// Cancel the deployment context
	execution.CancelFunc()

	return nil
}

// GetStatus returns the current status of a deployment
func (do *DeploymentOrchestrator) GetStatus(ctx context.Context, deploymentID string) (map[string]interface{}, error) {
	do.mutex.RLock()
	execution, exists := do.activeDeployments[deploymentID]
	do.mutex.RUnlock()

	if !exists {
		// Deployment is not active, get status from database
		deployment, err := do.repoManager.Deployment.GetByID(ctx, deploymentID)
		if err != nil {
			return nil, err
		}

		return map[string]interface{}{
			"status":      deployment.Status,
			"progress":    deployment.Progress,
			"currentStep": "completed",
			"active":      false,
		}, nil
	}

	return map[string]interface{}{
		"status":      execution.Status,
		"progress":    execution.Progress,
		"currentStep": execution.CurrentStep,
		"active":      true,
		"startTime":   execution.StartTime,
		"duration":    time.Since(execution.StartTime).String(),
	}, nil
}

// GetActiveDeployments returns all currently active deployments
func (do *DeploymentOrchestrator) GetActiveDeployments() map[string]*DeploymentExecution {
	do.mutex.RLock()
	defer do.mutex.RUnlock()

	// Return a copy to avoid concurrent access issues
	result := make(map[string]*DeploymentExecution)
	for k, v := range do.activeDeployments {
		result[k] = v
	}
	return result
}

// HealthCheck returns the health status of the orchestrator
func (do *DeploymentOrchestrator) HealthCheck() map[string]interface{} {
	do.mutex.RLock()
	activeCount := len(do.activeDeployments)
	do.mutex.RUnlock()

	return map[string]interface{}{
		"status":            "healthy",
		"activeDeployments": activeCount,
		"timestamp":         time.Now(),
	}
}
