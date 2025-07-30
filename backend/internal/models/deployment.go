package models

import "time"

type Deployment struct {
	ID             string                 `json:"id" db:"id"`
	OrganizationID string                 `json:"organizationId" db:"organization_id"`
	Name           string                 `json:"name" db:"name"`
	Application    string                 `json:"application" db:"application"`
	Version        string                 `json:"version" db:"version"`
	Environment    string                 `json:"environment" db:"environment"`
	Status         string                 `json:"status" db:"status"`
	Progress       int                    `json:"progress" db:"progress"`
	Configuration  map[string]interface{} `json:"configuration" db:"configuration"`
	StartedAt      *time.Time             `json:"startedAt" db:"started_at"`
	CompletedAt    *time.Time             `json:"completedAt" db:"completed_at"`
	CreatedBy      *string                `json:"createdBy" db:"created_by"`
	CreatedAt      time.Time              `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time              `json:"updatedAt" db:"updated_at"`
}

// Deployment status constants
const (
	DeploymentStatusPending     = "pending"
	DeploymentStatusRunning     = "running"
	DeploymentStatusCompleted   = "completed"
	DeploymentStatusFailed      = "failed"
	DeploymentStatusCancelled   = "cancelled"
	DeploymentStatusRollingBack = "rolling_back"
)

// Environment constants
const (
	EnvironmentDevelopment = "development"
	EnvironmentStaging     = "staging"
	EnvironmentProduction  = "production"
	EnvironmentTesting     = "testing"
)

// CreateDeploymentRequest represents a request to create a new deployment
type CreateDeploymentRequest struct {
	Name          string                 `json:"name" binding:"required,min=1,max=255"`
	Application   string                 `json:"application" binding:"required,min=1,max=255"`
	Version       string                 `json:"version" binding:"required,min=1,max=100"`
	Environment   string                 `json:"environment" binding:"required,min=1,max=50"`
	Configuration map[string]interface{} `json:"configuration,omitempty"`
}

// UpdateDeploymentRequest represents a request to update a deployment
type UpdateDeploymentRequest struct {
	Name          *string                `json:"name,omitempty" binding:"omitempty,min=1,max=255"`
	Status        *string                `json:"status,omitempty" binding:"omitempty,min=1,max=50"`
	Progress      *int                   `json:"progress,omitempty" binding:"omitempty,min=0,max=100"`
	Configuration map[string]interface{} `json:"configuration,omitempty"`
	StartedAt     *time.Time             `json:"startedAt,omitempty"`
	CompletedAt   *time.Time             `json:"completedAt,omitempty"`
}