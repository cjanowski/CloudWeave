package models

import "time"

type Alert struct {
	ID              string     `json:"id" db:"id"`
	OrganizationID  string     `json:"organizationId" db:"organization_id"`
	Type            string     `json:"type" db:"type"`
	Severity        string     `json:"severity" db:"severity"`
	Title           string     `json:"title" db:"title"`
	Message         string     `json:"message" db:"message"`
	ResourceID      *string    `json:"resourceId" db:"resource_id"`
	ResourceType    *string    `json:"resourceType" db:"resource_type"`
	Acknowledged    bool       `json:"acknowledged" db:"acknowledged"`
	AcknowledgedBy  *string    `json:"acknowledgedBy" db:"acknowledged_by"`
	AcknowledgedAt  *time.Time `json:"acknowledgedAt" db:"acknowledged_at"`
	CreatedAt       time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt       time.Time  `json:"updatedAt" db:"updated_at"`
}

type CreateAlertRequest struct {
	Type         string  `json:"type" binding:"required,min=1,max=50"`
	Severity     string  `json:"severity" binding:"required,oneof=low medium high critical"`
	Title        string  `json:"title" binding:"required,min=1,max=255"`
	Message      string  `json:"message" binding:"required,min=1"`
	ResourceID   *string `json:"resourceId,omitempty"`
	ResourceType *string `json:"resourceType,omitempty"`
}

type UpdateAlertRequest struct {
	Acknowledged *bool `json:"acknowledged,omitempty"`
}

type AlertQuery struct {
	Type         *string `json:"type,omitempty"`
	Severity     *string `json:"severity,omitempty"`
	ResourceID   *string `json:"resourceId,omitempty"`
	ResourceType *string `json:"resourceType,omitempty"`
	Acknowledged *bool   `json:"acknowledged,omitempty"`
	Limit        int     `json:"limit,omitempty"`
	Offset       int     `json:"offset,omitempty"`
}

// Alert severities
const (
	SeverityLow      = "low"
	SeverityMedium   = "medium"
	SeverityHigh     = "high"
	SeverityCritical = "critical"
)

// Alert types
const (
	AlertTypeSystem       = "system"
	AlertTypePerformance  = "performance"
	AlertTypeSecurity     = "security"
	AlertTypeDeployment   = "deployment"
	AlertTypeInfrastructure = "infrastructure"
	AlertTypeCost         = "cost"
)