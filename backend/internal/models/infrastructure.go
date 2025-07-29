package models

import "time"

type Infrastructure struct {
	ID             string                 `json:"id" db:"id"`
	OrganizationID string                 `json:"organizationId" db:"organization_id"`
	Name           string                 `json:"name" db:"name"`
	Type           string                 `json:"type" db:"type"`
	Provider       string                 `json:"provider" db:"provider"`
	Region         string                 `json:"region" db:"region"`
	Status         string                 `json:"status" db:"status"`
	Specifications map[string]interface{} `json:"specifications" db:"specifications"`
	CostInfo       map[string]interface{} `json:"costInfo" db:"cost_info"`
	Tags           []string               `json:"tags" db:"tags"`
	ExternalID     *string                `json:"externalId" db:"external_id"`
	CreatedAt      time.Time              `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time              `json:"updatedAt" db:"updated_at"`
}

type CreateInfrastructureRequest struct {
	Name           string                 `json:"name" binding:"required,min=1,max=255" validate:"required,min=1,max=255" example:"web-server-01"`
	Type           string                 `json:"type" binding:"required,resource_type" validate:"required,resource_type" example:"server"`
	Provider       string                 `json:"provider" binding:"required,cloud_provider" validate:"required,cloud_provider" example:"aws"`
	Region         string                 `json:"region" binding:"required,min=1,max=100" validate:"required,min=1,max=100" example:"us-east-1"`
	Specifications map[string]interface{} `json:"specifications,omitempty"`
	Tags           []string               `json:"tags,omitempty" example:"[\"production\",\"web\"]"`
}

type UpdateInfrastructureRequest struct {
	Name           *string                `json:"name,omitempty" binding:"omitempty,min=1,max=255" validate:"omitempty,min=1,max=255" example:"web-server-01-updated"`
	Status         *string                `json:"status,omitempty" binding:"omitempty,min=1,max=50" validate:"omitempty,oneof=pending running stopped terminated error" example:"running"`
	Specifications map[string]interface{} `json:"specifications,omitempty"`
	CostInfo       map[string]interface{} `json:"costInfo,omitempty"`
	Tags           []string               `json:"tags,omitempty" example:"[\"production\",\"web\",\"updated\"]"`
	ExternalID     *string                `json:"externalId,omitempty" example:"i-1234567890abcdef0"`
}

// Infrastructure status constants
const (
	InfraStatusPending    = "pending"
	InfraStatusRunning    = "running"
	InfraStatusStopped    = "stopped"
	InfraStatusTerminated = "terminated"
	InfraStatusError      = "error"
)

// Infrastructure types
const (
	InfraTypeServer    = "server"
	InfraTypeDatabase  = "database"
	InfraTypeStorage   = "storage"
	InfraTypeNetwork   = "network"
	InfraTypeContainer = "container"
)

// Cloud providers
const (
	ProviderAWS   = "aws"
	ProviderGCP   = "gcp"
	ProviderAzure = "azure"
)
