package services

import (
	"context"
	"fmt"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"
)

type DeploymentService struct {
	repoManager  *repositories.RepositoryManager
	orchestrator *DeploymentOrchestrator
	logger       *DeploymentLogger
}

func NewDeploymentService(repoManager *repositories.RepositoryManager) *DeploymentService {
	service := &DeploymentService{
		repoManager:  repoManager,
		orchestrator: NewDeploymentOrchestrator(repoManager),
		logger:       NewDeploymentLogger(repoManager),
	}

	return service
}

// CreateDeployment creates and starts a new deployment
func (s *DeploymentService) CreateDeployment(ctx context.Context, deployment *models.Deployment) error {
	// Create deployment in database
	if err := s.repoManager.Deployment.Create(ctx, deployment); err != nil {
		return fmt.Errorf("failed to create deployment: %w", err)
	}

	// Start deployment orchestration in background
	go s.orchestrator.StartDeployment(ctx, deployment)

	return nil
}

// GetDeploymentHistory retrieves deployment history for an application
func (s *DeploymentService) GetDeploymentHistory(ctx context.Context, orgID, application, environment string, params repositories.ListParams) ([]*models.Deployment, error) {
	var deployments []*models.Deployment

	if environment != "" {
		// Get deployments for specific application and environment
		allDeployments, err := s.repoManager.Deployment.ListByEnvironment(ctx, orgID, environment, params)
		if err != nil {
			return nil, err
		}
		
		// Filter by application
		for _, d := range allDeployments {
			if d.Application == application {
				deployments = append(deployments, d)
			}
		}
	} else {
		// Get all deployments for application across all environments
		allDeployments, err := s.repoManager.Deployment.List(ctx, orgID, params)
		if err != nil {
			return nil, err
		}
		
		// Filter by application
		for _, d := range allDeployments {
			if d.Application == application {
				deployments = append(deployments, d)
			}
		}
	}

	return deployments, nil
}

// GetDeploymentLogs retrieves logs for a deployment
func (s *DeploymentService) GetDeploymentLogs(ctx context.Context, deploymentID string) ([]DeploymentLog, error) {
	return s.logger.GetLogs(ctx, deploymentID)
}

// RollbackDeployment creates a rollback deployment
func (s *DeploymentService) RollbackDeployment(ctx context.Context, deploymentID, targetVersion, reason string) (*models.Deployment, error) {
	// Get original deployment
	originalDeployment, err := s.repoManager.Deployment.GetByID(ctx, deploymentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get original deployment: %w", err)
	}

	// Create rollback deployment
	rollbackDeployment := &models.Deployment{
		ID:             fmt.Sprintf("rollback-%s-%d", deploymentID, time.Now().Unix()),
		OrganizationID: originalDeployment.OrganizationID,
		Name:           fmt.Sprintf("Rollback: %s", originalDeployment.Name),
		Application:    originalDeployment.Application,
		Version:        targetVersion,
		Environment:    originalDeployment.Environment,
		Status:         models.DeploymentStatusPending,
		Progress:       0,
		Configuration:  originalDeployment.Configuration,
		CreatedBy:      originalDeployment.CreatedBy,
	}

	// Add rollback metadata to configuration
	if rollbackDeployment.Configuration == nil {
		rollbackDeployment.Configuration = make(map[string]interface{})
	}
	rollbackDeployment.Configuration["rollback"] = map[string]interface{}{
		"originalDeploymentId": deploymentID,
		"reason":               reason,
		"targetVersion":        targetVersion,
	}

	// Create rollback deployment
	if err := s.CreateDeployment(ctx, rollbackDeployment); err != nil {
		return nil, fmt.Errorf("failed to create rollback deployment: %w", err)
	}

	// Update original deployment status
	originalDeployment.Status = models.DeploymentStatusRollingBack
	s.repoManager.Deployment.Update(ctx, originalDeployment)

	return rollbackDeployment, nil
}

// CancelDeployment cancels a running deployment
func (s *DeploymentService) CancelDeployment(ctx context.Context, deploymentID, reason string) error {
	deployment, err := s.repoManager.Deployment.GetByID(ctx, deploymentID)
	if err != nil {
		return fmt.Errorf("failed to get deployment: %w", err)
	}

	if deployment.Status != models.DeploymentStatusRunning && deployment.Status != models.DeploymentStatusPending {
		return fmt.Errorf("deployment cannot be cancelled in status: %s", deployment.Status)
	}

	// Cancel deployment through orchestrator
	if err := s.orchestrator.CancelDeployment(ctx, deploymentID, reason); err != nil {
		return fmt.Errorf("failed to cancel deployment: %w", err)
	}

	// Update deployment status
	deployment.Status = models.DeploymentStatusCancelled
	now := time.Now()
	deployment.CompletedAt = &now

	return s.repoManager.Deployment.Update(ctx, deployment)
}

// GetRealTimeStatus gets real-time deployment status
func (s *DeploymentService) GetRealTimeStatus(ctx context.Context, deploymentID string) (map[string]interface{}, error) {
	deployment, err := s.repoManager.Deployment.GetByID(ctx, deploymentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get deployment: %w", err)
	}

	// Get real-time status from orchestrator
	orchestratorStatus, err := s.orchestrator.GetStatus(ctx, deploymentID)
	if err != nil {
		// If orchestrator fails, return database status
		orchestratorStatus = map[string]interface{}{
			"status":   deployment.Status,
			"progress": deployment.Progress,
		}
	}

	// Get recent logs
	logs, _ := s.logger.GetRecentLogs(ctx, deploymentID, 10)

	return map[string]interface{}{
		"deployment":  deployment,
		"realTime":    orchestratorStatus,
		"recentLogs":  logs,
		"lastUpdated": time.Now(),
	}, nil
}

// DeploymentLog represents a deployment log entry
type DeploymentLog struct {
	ID           string    `json:"id"`
	DeploymentID string    `json:"deploymentId"`
	Level        string    `json:"level"`
	Message      string    `json:"message"`
	Timestamp    time.Time `json:"timestamp"`
	Source       string    `json:"source"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
}

// DeploymentLogger handles deployment logging
type DeploymentLogger struct {
	repoManager *repositories.RepositoryManager
}

func NewDeploymentLogger(repoManager *repositories.RepositoryManager) *DeploymentLogger {
	return &DeploymentLogger{repoManager: repoManager}
}

func (dl *DeploymentLogger) LogInfo(ctx context.Context, deploymentID, message string, metadata map[string]interface{}) {
	dl.log(ctx, deploymentID, "info", message, metadata)
}

func (dl *DeploymentLogger) LogError(ctx context.Context, deploymentID, message string, metadata map[string]interface{}) {
	dl.log(ctx, deploymentID, "error", message, metadata)
}

func (dl *DeploymentLogger) LogWarning(ctx context.Context, deploymentID, message string, metadata map[string]interface{}) {
	dl.log(ctx, deploymentID, "warning", message, metadata)
}

func (dl *DeploymentLogger) log(ctx context.Context, deploymentID, level, message string, metadata map[string]interface{}) {
	// In a real implementation, this would store logs in a dedicated logging system
	// For now, we'll simulate logging
	log := DeploymentLog{
		ID:           fmt.Sprintf("%s-%d", deploymentID, time.Now().UnixNano()),
		DeploymentID: deploymentID,
		Level:        level,
		Message:      message,
		Timestamp:    time.Now(),
		Source:       "deployment-service",
		Metadata:     metadata,
	}

	// Store in audit log for now
	auditLog := &models.AuditLog{
		ID:             log.ID,
		OrganizationID: "", // Will be set by repository if needed
		UserID:         nil, // System generated
		Action:         fmt.Sprintf("deployment.%s", level),
		ResourceType:   &[]string{"deployment"}[0],
		ResourceID:     &deploymentID,
		Details:        map[string]interface{}{
			"message":  message,
			"metadata": metadata,
		},
		IPAddress: nil,
		UserAgent: nil,
		CreatedAt: time.Now(),
	}

	dl.repoManager.AuditLog.Create(ctx, auditLog)
}

func (dl *DeploymentLogger) GetLogs(ctx context.Context, deploymentID string) ([]DeploymentLog, error) {
	// Create a query to get audit logs for this deployment
	query := models.AuditLogQuery{
		ResourceType: &[]string{"deployment"}[0],
		ResourceID:   &deploymentID,
		StartTime:    time.Now().AddDate(0, 0, -30), // Last 30 days
		EndTime:      time.Now(),
		Limit:        1000,
		Offset:       0,
	}
	
	auditLogs, err := dl.repoManager.AuditLog.Query(ctx, "", query)
	if err != nil {
		return nil, err
	}

	logs := make([]DeploymentLog, 0, len(auditLogs))
	for _, auditLog := range auditLogs {
		if details, ok := auditLog.Details["message"].(string); ok {
			log := DeploymentLog{
				ID:           auditLog.ID,
				DeploymentID: deploymentID,
				Level:        extractLogLevel(auditLog.Action),
				Message:      details,
				Timestamp:    auditLog.CreatedAt,
				Source:       "deployment-service",
			}
			if metadata, ok := auditLog.Details["metadata"].(map[string]interface{}); ok {
				log.Metadata = metadata
			}
			logs = append(logs, log)
		}
	}

	return logs, nil
}

func (dl *DeploymentLogger) GetRecentLogs(ctx context.Context, deploymentID string, limit int) ([]DeploymentLog, error) {
	logs, err := dl.GetLogs(ctx, deploymentID)
	if err != nil {
		return nil, err
	}

	if len(logs) > limit {
		return logs[len(logs)-limit:], nil
	}
	return logs, nil
}

func extractLogLevel(action string) string {
	if len(action) > 11 && action[:11] == "deployment." {
		return action[11:]
	}
	return "info"
}