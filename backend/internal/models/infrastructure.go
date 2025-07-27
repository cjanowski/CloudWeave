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
	Name           string                 `json:"name" binding:"required,min=1,max=255"`
	Type           string                 `json:"type" binding:"required,min=1,max=50"`
	Provider       string                 `json:"provider" binding:"required,min=1,max=50"`
	Region         string                 `json:"region" binding:"required,min=1,max=100"`
	Specifications map[string]interface{} `json:"specifications,omitempty"`
	Tags           []string               `json:"tags,omitempty"`
}

type UpdateInfrastructureRequest struct {
	Name           *string                `json:"name,omitempty" binding:"omitempty,min=1,max=255"`
	Status         *string                `json:"status,omitempty" binding:"omitempty,min=1,max=50"`
	Specifications map[string]interface{} `json:"specifications,omitempty"`
	CostInfo       map[string]interface{} `json:"costInfo,omitempty"`
	Tags           []string               `json:"tags,omitempty"`
	ExternalID     *string                `json:"externalId,omitempty"`
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
