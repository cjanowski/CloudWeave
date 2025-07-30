package models

import "time"

type Alert struct {
	ID             string     `json:"id" db:"id"`
	OrganizationID string     `json:"organizationId" db:"organization_id"`
	Type           string     `json:"type" db:"type"`
	Severity       string     `json:"severity" db:"severity"`
	Title          string     `json:"title" db:"title"`
	Message        string     `json:"message" db:"message"`
	ResourceID     *string    `json:"resourceId" db:"resource_id"`
	ResourceType   *string    `json:"resourceType" db:"resource_type"`
	Acknowledged   bool       `json:"acknowledged" db:"acknowledged"`
	AcknowledgedBy *string    `json:"acknowledgedBy" db:"acknowledged_by"`
	AcknowledgedAt *time.Time `json:"acknowledgedAt" db:"acknowledged_at"`
	CreatedAt      time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time  `json:"updatedAt" db:"updated_at"`
}

// Alert types
const (
	AlertTypePerformance = "performance"
	AlertTypeSecurity    = "security"
	AlertTypeCost        = "cost"
	AlertTypeCompliance  = "compliance"
	AlertTypeSystem      = "system"
	AlertTypeCustom      = "custom"
)

// Alert severity levels
const (
	AlertSeverityInfo     = "info"
	AlertSeverityWarning  = "warning"
	AlertSeverityError    = "error"
	AlertSeverityCritical = "critical"
)

// AlertQuery represents query parameters for alerts
type AlertQuery struct {
	Type         *string    `json:"type"`
	Severity     *string    `json:"severity"`
	ResourceID   *string    `json:"resourceId"`
	ResourceType *string    `json:"resourceType"`
	Acknowledged *bool      `json:"acknowledged"`
	StartTime    *time.Time `json:"startTime"`
	EndTime      *time.Time `json:"endTime"`
	Limit        int        `json:"limit"`
	Offset       int        `json:"offset"`
}