package models

import (
	"time"
)

// ComplianceFramework represents different compliance frameworks
type ComplianceFramework string

const (
	FrameworkSOC2     ComplianceFramework = "soc2"
	FrameworkISO27001 ComplianceFramework = "iso27001"
	FrameworkGDPR     ComplianceFramework = "gdpr"
	FrameworkHIPAA    ComplianceFramework = "hipaa"
	FrameworkPCIDSS   ComplianceFramework = "pci_dss"
	FrameworkNIST     ComplianceFramework = "nist"
	FrameworkCustom   ComplianceFramework = "custom"
)

// ComplianceStatus represents the status of compliance
type ComplianceStatus string

const (
	ComplianceStatusCompliant    ComplianceStatus = "compliant"
	ComplianceStatusNonCompliant ComplianceStatus = "non_compliant"
	ComplianceStatusPartial      ComplianceStatus = "partial"
	ComplianceStatusUnderReview  ComplianceStatus = "under_review"
	ComplianceStatusNotApplicable ComplianceStatus = "not_applicable"
	ComplianceAssessmentStatusRunning ComplianceStatus = "running"
)

// ComplianceControlStatus represents the status of individual controls
type ComplianceControlStatus string

const (
	ComplianceControlStatusCompliant    ComplianceControlStatus = "compliant"
	ComplianceControlStatusNonCompliant ComplianceControlStatus = "non_compliant"
	ComplianceControlStatusPending      ComplianceControlStatus = "pending"
	ControlStatusPassed                 ComplianceControlStatus = "passed"
	ControlStatusFailed                 ComplianceControlStatus = "failed"
	ControlStatusWarning                ComplianceControlStatus = "warning"
	ControlStatusSkipped                ComplianceControlStatus = "skipped"
	ControlStatusManual                 ComplianceControlStatus = "manual"
)

// ComplianceSeverity represents the severity of compliance violations
type ComplianceSeverity string

const (
	ComplianceSeverityCritical ComplianceSeverity = "critical"
	ComplianceSeverityHigh     ComplianceSeverity = "high"
	ComplianceSeverityMedium   ComplianceSeverity = "medium"
	ComplianceSeverityLow      ComplianceSeverity = "low"
	ComplianceSeverityInfo     ComplianceSeverity = "info"
)

// ComplianceFrameworkConfig represents configuration for a compliance framework
type ComplianceFrameworkConfig struct {
	ID             string              `json:"id" db:"id"`
	OrganizationID string              `json:"organizationId" db:"organization_id"`
	Framework      ComplianceFramework `json:"framework" db:"framework"`
	Type           string              `json:"type" db:"type"`
	Name           string              `json:"name" db:"name"`
	Description    string              `json:"description" db:"description"`
	Version        string              `json:"version" db:"version"`
	Enabled        bool                `json:"enabled" db:"enabled"`
	Configuration  map[string]interface{} `json:"configuration" db:"configuration"`
	CreatedAt      time.Time           `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time           `json:"updatedAt" db:"updated_at"`
}

// ComplianceControl represents an individual compliance control
type ComplianceControl struct {
	ID             string                   `json:"id" db:"id"`
	FrameworkID    string                   `json:"frameworkId" db:"framework_id"`
	ControlID      string                   `json:"controlId" db:"control_id"`
	Title          string                   `json:"title" db:"title"`
	Description    string                   `json:"description" db:"description"`
	Category       string                   `json:"category" db:"category"`
	Subcategory    string                   `json:"subcategory" db:"subcategory"`
	Status         ComplianceControlStatus  `json:"status" db:"status"`
	Severity       ComplianceSeverity       `json:"severity" db:"severity"`
	AutomatedCheck bool                     `json:"automatedCheck" db:"automated_check"`
	CheckQuery     *string                  `json:"checkQuery" db:"check_query"`
	Evidence       []string                 `json:"evidence" db:"evidence"`
	Remediation    string                   `json:"remediation" db:"remediation"`
	Owner          *string                  `json:"owner" db:"owner"`
	DueDate        *time.Time               `json:"dueDate" db:"due_date"`
	LastChecked    *time.Time               `json:"lastChecked" db:"last_checked"`
	NextCheck      *time.Time               `json:"nextCheck" db:"next_check"`
	CreatedAt      time.Time                `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time                `json:"updatedAt" db:"updated_at"`
}

// ComplianceStatistics represents compliance statistics
type ComplianceStatistics struct {
	TotalControls        int                                    `json:"totalControls"`
	CompliantControls    int                                    `json:"compliantControls"`
	NonCompliantControls int                                    `json:"nonCompliantControls"`
	PendingControls      int                                    `json:"pendingControls"`
	CompliancePercentage float64                                `json:"compliancePercentage"`
	StatusBreakdown      map[ComplianceControlStatus]int        `json:"statusBreakdown"`
	SeverityBreakdown    map[ComplianceSeverity]int             `json:"severityBreakdown"`
}

// ComplianceAssessment represents a compliance assessment
type ComplianceAssessment struct {
	ID             string            `json:"id" db:"id"`
	OrganizationID string            `json:"organizationId" db:"organization_id"`
	FrameworkID    string            `json:"frameworkId" db:"framework_id"`
	UserID         string            `json:"userId" db:"user_id"`
	Name           string            `json:"name" db:"name"`
	Description    string            `json:"description" db:"description"`
	Status         ComplianceStatus  `json:"status" db:"status"`
	Score          float64           `json:"score" db:"score"`
	MaxScore       float64           `json:"maxScore" db:"max_score"`
	StartedAt      *time.Time        `json:"startedAt" db:"started_at"`
	CompletedAt    *time.Time        `json:"completedAt" db:"completed_at"`
	DueDate        *time.Time        `json:"dueDate" db:"due_date"`
	Summary        *AssessmentSummary `json:"summary" db:"summary"`
	CreatedAt      time.Time         `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time         `json:"updatedAt" db:"updated_at"`
}

// AssessmentSummary represents a summary of assessment results
type AssessmentSummary struct {
	TotalControls       int                                    `json:"totalControls"`
	PassedControls      int                                    `json:"passedControls"`
	FailedControls      int                                    `json:"failedControls"`
	WarningControls     int                                    `json:"warningControls"`
	ManualControls      int                                    `json:"manualControls"`
	ControlsBySeverity  map[ComplianceSeverity]int             `json:"controlsBySeverity"`
	ControlsByCategory  map[string]int                         `json:"controlsByCategory"`
	ControlsByStatus    map[ComplianceControlStatus]int        `json:"controlsByStatus"`
	ComplianceGaps      []ComplianceGap                        `json:"complianceGaps"`
	Recommendations     []string                               `json:"recommendations"`
}

// ComplianceGap represents a compliance gap or violation
type ComplianceGap struct {
	ID             string                   `json:"id" db:"id"`
	AssessmentID   string                   `json:"assessmentId" db:"assessment_id"`
	ControlID      string                   `json:"controlId" db:"control_id"`
	Title          string                   `json:"title" db:"title"`
	Description    string                   `json:"description" db:"description"`
	Severity       ComplianceSeverity       `json:"severity" db:"severity"`
	Status         ComplianceControlStatus  `json:"status" db:"status"`
	Impact         string                   `json:"impact" db:"impact"`
	Remediation    string                   `json:"remediation" db:"remediation"`
	Owner          *string                  `json:"owner" db:"owner"`
	DueDate        *time.Time               `json:"dueDate" db:"due_date"`
	ResolvedAt     *time.Time               `json:"resolvedAt" db:"resolved_at"`
	Evidence       []string                 `json:"evidence" db:"evidence"`
	CreatedAt      time.Time                `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time                `json:"updatedAt" db:"updated_at"`
}

// ComplianceReport represents a compliance report
type ComplianceReport struct {
	ID             string                    `json:"id" db:"id"`
	OrganizationID string                    `json:"organizationId" db:"organization_id"`
	UserID         string                    `json:"userId" db:"user_id"`
	Name           string                    `json:"name" db:"name"`
	Description    string                    `json:"description" db:"description"`
	Type           string                    `json:"type" db:"type"`
	Frameworks     []ComplianceFramework     `json:"frameworks" db:"frameworks"`
	Period         ReportPeriod              `json:"period" db:"period"`
	Status         string                    `json:"status" db:"status"`
	Data           map[string]interface{}    `json:"data" db:"data"`
	GeneratedAt    *time.Time                `json:"generatedAt" db:"generated_at"`
	CreatedAt      time.Time                 `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time                 `json:"updatedAt" db:"updated_at"`
}

// ReportPeriod represents the period for compliance reporting
type ReportPeriod struct {
	StartDate time.Time `json:"startDate"`
	EndDate   time.Time `json:"endDate"`
}

// ComplianceMetrics represents overall compliance metrics
type ComplianceMetrics struct {
	OverallScore           float64                                `json:"overallScore"`
	FrameworkScores        map[ComplianceFramework]float64        `json:"frameworkScores"`
	TotalControls          int                                    `json:"totalControls"`
	PassedControls         int                                    `json:"passedControls"`
	FailedControls         int                                    `json:"failedControls"`
	ControlsBySeverity     map[ComplianceSeverity]int             `json:"controlsBySeverity"`
	ControlsByStatus       map[ComplianceControlStatus]int        `json:"controlsByStatus"`
	FrameworkCompliance    map[ComplianceFramework]ComplianceStatus `json:"frameworkCompliance"`
	RecentAssessments      int                                    `json:"recentAssessments"`
	PendingRemediation     int                                    `json:"pendingRemediation"`
	OverdueControls        int                                    `json:"overdueControls"`
	ComplianceTrends       []ComplianceTrendPoint                 `json:"complianceTrends"`
}

// ComplianceTrendPoint represents a point in compliance trend data
type ComplianceTrendPoint struct {
	Date            time.Time                              `json:"date"`
	OverallScore    float64                                `json:"overallScore"`
	FrameworkScores map[ComplianceFramework]float64        `json:"frameworkScores"`
	ControlsPassed  int                                    `json:"controlsPassed"`
	ControlsFailed  int                                    `json:"controlsFailed"`
}

// CreateFrameworkRequest represents a request to create a compliance framework
type CreateFrameworkRequest struct {
	Framework     ComplianceFramework    `json:"framework" binding:"required"`
	Name          string                 `json:"name" binding:"required,min=1,max=255"`
	Description   string                 `json:"description"`
	Version       string                 `json:"version"`
	Enabled       bool                   `json:"enabled"`
	Configuration map[string]interface{} `json:"configuration,omitempty"`
}

// CreateAssessmentRequest represents a request to create a compliance assessment
type CreateAssessmentRequest struct {
	FrameworkID string     `json:"frameworkId" binding:"required"`
	Name        string     `json:"name" binding:"required,min=1,max=255"`
	Description string     `json:"description"`
	DueDate     *time.Time `json:"dueDate,omitempty"`
}

// UpdateControlRequest represents a request to update a compliance control
type UpdateControlRequest struct {
	Status      ComplianceControlStatus `json:"status" binding:"required"`
	Evidence    []string                `json:"evidence,omitempty"`
	Remediation *string                 `json:"remediation,omitempty"`
	Owner       *string                 `json:"owner,omitempty"`
	DueDate     *time.Time              `json:"dueDate,omitempty"`
}

// ComplianceQuery represents query parameters for compliance search
type ComplianceQuery struct {
	Framework    *ComplianceFramework     `json:"framework,omitempty"`
	Status       *ComplianceStatus        `json:"status,omitempty"`
	Severity     *ComplianceSeverity      `json:"severity,omitempty"`
	Category     *string                  `json:"category,omitempty"`
	Owner        *string                  `json:"owner,omitempty"`
	StartDate    *time.Time               `json:"startDate,omitempty"`
	EndDate      *time.Time               `json:"endDate,omitempty"`
	Limit        int                      `json:"limit,omitempty"`
	Offset       int                      `json:"offset,omitempty"`
}