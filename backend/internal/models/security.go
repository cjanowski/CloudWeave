package models

import (
	"time"
)

// VulnerabilitySeverity represents the severity level of a vulnerability
type VulnerabilitySeverity string

const (
	VulnSeverityCritical VulnerabilitySeverity = "critical"
	VulnSeverityHigh     VulnerabilitySeverity = "high"
	VulnSeverityMedium   VulnerabilitySeverity = "medium"
	VulnSeverityLow      VulnerabilitySeverity = "low"
	VulnSeverityInfo     VulnerabilitySeverity = "info"
)

// VulnerabilityStatus represents the status of a vulnerability
type VulnerabilityStatus string

const (
	VulnStatusOpen       VulnerabilityStatus = "open"
	VulnStatusInProgress VulnerabilityStatus = "in_progress"
	VulnStatusResolved   VulnerabilityStatus = "resolved"
	VulnStatusIgnored    VulnerabilityStatus = "ignored"
)

// ScanType represents the type of security scan
type ScanType string

const (
	ScanTypeInfrastructure ScanType = "infrastructure"
	ScanTypeApplication    ScanType = "application"
	ScanTypeContainer      ScanType = "container"
	ScanTypeNetwork        ScanType = "network"
	ScanTypeCompliance     ScanType = "compliance"
)

// ScanStatus represents the status of a security scan
type ScanStatus string

const (
	ScanStatusPending   ScanStatus = "pending"
	ScanStatusRunning   ScanStatus = "running"
	ScanStatusCompleted ScanStatus = "completed"
	ScanStatusFailed    ScanStatus = "failed"
	ScanStatusCancelled ScanStatus = "cancelled"
)

// Vulnerability represents a security vulnerability
type Vulnerability struct {
	ID             string                `json:"id" db:"id"`
	OrganizationID string                `json:"organizationId" db:"organization_id"`
	ScanID         string                `json:"scanId" db:"scan_id"`
	Title          string                `json:"title" db:"title"`
	Description    string                `json:"description" db:"description"`
	Severity       VulnerabilitySeverity `json:"severity" db:"severity"`
	Status         VulnerabilityStatus   `json:"status" db:"status"`
	CVEID          *string               `json:"cveId" db:"cve_id"`
	CVSSScore      *float64              `json:"cvssScore" db:"cvss_score"`
	ResourceType   string                `json:"resourceType" db:"resource_type"`
	ResourceID     string                `json:"resourceId" db:"resource_id"`
	ResourceName   string                `json:"resourceName" db:"resource_name"`
	Recommendation string                `json:"recommendation" db:"recommendation"`
	References     []string              `json:"references" db:"reference_links"`
	Tags           []string              `json:"tags" db:"tags"`
	FirstDetected  time.Time             `json:"firstDetected" db:"first_detected"`
	LastSeen       time.Time             `json:"lastSeen" db:"last_seen"`
	ResolvedAt     *time.Time            `json:"resolvedAt" db:"resolved_at"`
	CreatedAt      time.Time             `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time             `json:"updatedAt" db:"updated_at"`
}

// SecurityScan represents a security scan
type SecurityScan struct {
	ID             string                 `json:"id" db:"id"`
	OrganizationID string                 `json:"organizationId" db:"organization_id"`
	UserID         string                 `json:"userId" db:"user_id"`
	Name           string                 `json:"name" db:"name"`
	Type           ScanType               `json:"type" db:"type"`
	Status         ScanStatus             `json:"status" db:"status"`
	TargetType     string                 `json:"targetType" db:"target_type"`
	TargetID       string                 `json:"targetId" db:"target_id"`
	TargetName     string                 `json:"targetName" db:"target_name"`
	Configuration  map[string]interface{} `json:"configuration" db:"configuration"`
	Progress       int                    `json:"progress" db:"progress"`
	StartedAt      *time.Time             `json:"startedAt" db:"started_at"`
	CompletedAt    *time.Time             `json:"completedAt" db:"completed_at"`
	Duration       *int                   `json:"duration" db:"duration"`
	ErrorMessage   *string                `json:"errorMessage" db:"error_message"`
	Summary        *ScanSummary           `json:"summary" db:"summary"`
	CreatedAt      time.Time              `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time              `json:"updatedAt" db:"updated_at"`
}

// ScanSummary represents a summary of scan results
type ScanSummary struct {
	TotalVulnerabilities      int                           `json:"totalVulnerabilities"`
	VulnerabilitiesBySeverity map[VulnerabilitySeverity]int `json:"vulnerabilitiesBySeverity"`
	ResourcesScanned          int                           `json:"resourcesScanned"`
	HighestSeverity           VulnerabilitySeverity         `json:"highestSeverity"`
	ComplianceScore           *float64                      `json:"complianceScore,omitempty"`
}

// CreateScanRequest represents a request to create a new security scan
type CreateScanRequest struct {
	Name          string                 `json:"name" binding:"required,min=1,max=255"`
	Type          ScanType               `json:"type" binding:"required"`
	TargetType    string                 `json:"targetType" binding:"required"`
	TargetID      string                 `json:"targetId" binding:"required"`
	TargetName    string                 `json:"targetName" binding:"required"`
	Configuration map[string]interface{} `json:"configuration,omitempty"`
}

// UpdateVulnerabilityRequest represents a request to update a vulnerability
type UpdateVulnerabilityRequest struct {
	Status         VulnerabilityStatus `json:"status" binding:"required"`
	Recommendation *string             `json:"recommendation,omitempty"`
	Tags           []string            `json:"tags,omitempty"`
}

// VulnerabilityQuery represents query parameters for vulnerability search
type VulnerabilityQuery struct {
	ScanID       *string                `json:"scanId,omitempty"`
	Severity     *VulnerabilitySeverity `json:"severity,omitempty"`
	Status       *VulnerabilityStatus   `json:"status,omitempty"`
	ResourceType *string                `json:"resourceType,omitempty"`
	ResourceID   *string                `json:"resourceId,omitempty"`
	CVEID        *string                `json:"cveId,omitempty"`
	StartDate    *time.Time             `json:"startDate,omitempty"`
	EndDate      *time.Time             `json:"endDate,omitempty"`
	Limit        int                    `json:"limit,omitempty"`
	Offset       int                    `json:"offset,omitempty"`
}

// SecurityMetrics represents security-related metrics
type SecurityMetrics struct {
	TotalVulnerabilities      int                           `json:"totalVulnerabilities"`
	OpenVulnerabilities       int                           `json:"openVulnerabilities"`
	VulnerabilitiesBySeverity map[VulnerabilitySeverity]int `json:"vulnerabilitiesBySeverity"`
	VulnerabilitiesByStatus   map[VulnerabilityStatus]int   `json:"vulnerabilitiesByStatus"`
	RecentScans               int                           `json:"recentScans"`
	ComplianceScore           float64                       `json:"complianceScore"`
	SecurityTrends            []SecurityTrendPoint          `json:"securityTrends"`
}

// SecurityTrendPoint represents a point in security trend data
type SecurityTrendPoint struct {
	Date               time.Time `json:"date"`
	VulnerabilityCount int       `json:"vulnerabilityCount"`
	CriticalCount      int       `json:"criticalCount"`
	HighCount          int       `json:"highCount"`
	ComplianceScore    float64   `json:"complianceScore"`
}
