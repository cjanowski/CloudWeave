package repositories

import (
	"context"
	"database/sql"
	"time"

	"cloudweave/internal/models"
)

// UserRepositoryInterface defines the contract for user data operations
type UserRepositoryInterface interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id string) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	UpdateLastLogin(ctx context.Context, userID string) error
	UpdatePassword(ctx context.Context, userID, passwordHash string) error
	Delete(ctx context.Context, id string) error
	EmailExists(ctx context.Context, email string) (bool, error)
	List(ctx context.Context, params ListParams) ([]*models.User, error)
}

// OrganizationRepositoryInterface defines the contract for organization data operations
type OrganizationRepositoryInterface interface {
	Create(ctx context.Context, org *models.Organization) error
	GetByID(ctx context.Context, id string) (*models.Organization, error)
	GetBySlug(ctx context.Context, slug string) (*models.Organization, error)
	Update(ctx context.Context, org *models.Organization) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, params ListParams) ([]*models.Organization, error)
	SlugExists(ctx context.Context, slug string) (bool, error)
}

// InfrastructureRepositoryInterface defines the contract for infrastructure data operations
type InfrastructureRepositoryInterface interface {
	Create(ctx context.Context, infra *models.Infrastructure) error
	GetByID(ctx context.Context, id string) (*models.Infrastructure, error)
	Update(ctx context.Context, infra *models.Infrastructure) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, orgID string, params ListParams) ([]*models.Infrastructure, error)
	ListByProvider(ctx context.Context, orgID, provider string, params ListParams) ([]*models.Infrastructure, error)
	ListByStatus(ctx context.Context, orgID, status string, params ListParams) ([]*models.Infrastructure, error)
	UpdateStatus(ctx context.Context, id, status string) error
	GetByExternalID(ctx context.Context, externalID string) (*models.Infrastructure, error)
}

// DeploymentRepositoryInterface defines the contract for deployment data operations
type DeploymentRepositoryInterface interface {
	Create(ctx context.Context, deployment *models.Deployment) error
	GetByID(ctx context.Context, id string) (*models.Deployment, error)
	Update(ctx context.Context, deployment *models.Deployment) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, orgID string, params ListParams) ([]*models.Deployment, error)
	ListByEnvironment(ctx context.Context, orgID, environment string, params ListParams) ([]*models.Deployment, error)
	ListByStatus(ctx context.Context, orgID, status string, params ListParams) ([]*models.Deployment, error)
	UpdateStatus(ctx context.Context, id, status string) error
	UpdateProgress(ctx context.Context, id string, progress int) error
}

// MetricRepositoryInterface defines the contract for metric data operations
type MetricRepositoryInterface interface {
	Create(ctx context.Context, metric *models.Metric) error
	CreateBatch(ctx context.Context, metrics []*models.Metric) error
	GetByID(ctx context.Context, id string) (*models.Metric, error)
	Query(ctx context.Context, query models.MetricQuery) ([]*models.Metric, error)
	Delete(ctx context.Context, id string) error
	DeleteOlderThan(ctx context.Context, cutoffTime string) error
	GetLatestByResource(ctx context.Context, resourceID, metricName string) (*models.Metric, error)
}

// AlertRepositoryInterface defines the contract for alert data operations
type AlertRepositoryInterface interface {
	Create(ctx context.Context, alert *models.Alert) error
	GetByID(ctx context.Context, id string) (*models.Alert, error)
	Update(ctx context.Context, alert *models.Alert) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, orgID string, params ListParams) ([]*models.Alert, error)
	Query(ctx context.Context, orgID string, query models.AlertQuery) ([]*models.Alert, error)
	Acknowledge(ctx context.Context, id, userID string) error
	ListUnacknowledged(ctx context.Context, orgID string, params ListParams) ([]*models.Alert, error)
}

// AuditLogRepositoryInterface defines the contract for audit log data operations
type AuditLogRepositoryInterface interface {
	Create(ctx context.Context, log *models.AuditLog) error
	GetByID(ctx context.Context, id string) (*models.AuditLog, error)
	Query(ctx context.Context, orgID string, query models.AuditLogQuery) ([]*models.AuditLog, error)
	Delete(ctx context.Context, id string) error
	DeleteOlderThan(ctx context.Context, cutoffTime string) error
	GetActionSummary(ctx context.Context, orgID string, startTime, endTime time.Time) (map[string]int, error)
	GetUserActivity(ctx context.Context, orgID string, startTime, endTime time.Time) ([]map[string]interface{}, error)
}

// SecurityScanRepositoryInterface defines the contract for security scan data operations
type SecurityScanRepositoryInterface interface {
	Create(ctx context.Context, scan *models.SecurityScan) error
	GetByID(ctx context.Context, orgID, id string) (*models.SecurityScan, error)
	Update(ctx context.Context, scan *models.SecurityScan) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, orgID string, limit, offset int) ([]*models.SecurityScan, int, error)
	GetRecentCount(ctx context.Context, orgID string, days int) (int, error)
}

// VulnerabilityRepositoryInterface defines the contract for vulnerability data operations
type VulnerabilityRepositoryInterface interface {
	Create(ctx context.Context, vulnerability *models.Vulnerability) error
	GetByID(ctx context.Context, orgID, id string) (*models.Vulnerability, error)
	Update(ctx context.Context, vulnerability *models.Vulnerability) error
	Delete(ctx context.Context, id string) error
	Query(ctx context.Context, orgID string, query models.VulnerabilityQuery) ([]*models.Vulnerability, int, error)
	GetCountsBySeverity(ctx context.Context, orgID string) (map[models.VulnerabilitySeverity]int, error)
	GetCountsByStatus(ctx context.Context, orgID string) (map[models.VulnerabilityStatus]int, error)
}

// ComplianceFrameworkRepositoryInterface defines the contract for compliance framework data operations
type ComplianceFrameworkRepositoryInterface interface {
	Create(ctx context.Context, framework *models.ComplianceFrameworkConfig) error
	GetByID(ctx context.Context, organizationID, frameworkID string) (*models.ComplianceFrameworkConfig, error)
	List(ctx context.Context, organizationID string, limit, offset int) ([]*models.ComplianceFrameworkConfig, int, error)
	Update(ctx context.Context, framework *models.ComplianceFrameworkConfig) error
	Delete(ctx context.Context, organizationID, frameworkID string) error
}

// ComplianceControlRepositoryInterface defines the contract for compliance control data operations
type ComplianceControlRepositoryInterface interface {
	Create(ctx context.Context, control *models.ComplianceControl) error
	GetByID(ctx context.Context, controlID string) (*models.ComplianceControl, error)
	ListByFramework(ctx context.Context, frameworkID string, limit, offset int) ([]*models.ComplianceControl, int, error)
	Update(ctx context.Context, control *models.ComplianceControl) error
	GetCountsByStatus(ctx context.Context, frameworkID string) (map[models.ComplianceControlStatus]int, error)
	GetCountsBySeverity(ctx context.Context, frameworkID string) (map[models.ComplianceSeverity]int, error)
}

// ComplianceAssessmentRepositoryInterface defines the contract for compliance assessment data operations
type ComplianceAssessmentRepositoryInterface interface {
	Create(ctx context.Context, assessment *models.ComplianceAssessment) error
	GetByID(ctx context.Context, organizationID, assessmentID string) (*models.ComplianceAssessment, error)
	List(ctx context.Context, organizationID string, limit, offset int) ([]*models.ComplianceAssessment, int, error)
	Update(ctx context.Context, assessment *models.ComplianceAssessment) error
}

// RoleRepositoryInterface defines the contract for role data operations
type RoleRepositoryInterface interface {
	Create(ctx context.Context, role *models.Role) error
	GetByID(ctx context.Context, organizationID, roleID string) (*models.Role, error)
	GetByName(ctx context.Context, organizationID, name string) (*models.Role, error)
	List(ctx context.Context, organizationID string, limit, offset int) ([]*models.Role, int, error)
	Update(ctx context.Context, role *models.Role) error
	Delete(ctx context.Context, organizationID, roleID string) error
	ListSystemRoles(ctx context.Context) ([]*models.Role, error)
}

// UserRoleRepositoryInterface defines the contract for user role assignment operations
type UserRoleRepositoryInterface interface {
	AssignRole(ctx context.Context, userRole *models.UserRole) error
	RemoveRole(ctx context.Context, userID, roleID, organizationID string) error
	GetUserRoles(ctx context.Context, userID, organizationID string) ([]*models.UserRole, error)
	GetRoleUsers(ctx context.Context, roleID, organizationID string) ([]*models.UserRole, error)
	IsUserInRole(ctx context.Context, userID, roleID, organizationID string) (bool, error)
	GetUserPermissions(ctx context.Context, userID, organizationID string) (*models.UserPermissions, error)
}

// ResourcePermissionRepositoryInterface defines the contract for resource permission operations
type ResourcePermissionRepositoryInterface interface {
	Grant(ctx context.Context, permission *models.ResourcePermission) error
	Revoke(ctx context.Context, userID, resourceType, resourceID, organizationID string) error
	GetUserResourcePermissions(ctx context.Context, userID, organizationID string) ([]*models.ResourcePermission, error)
	GetResourcePermissions(ctx context.Context, resourceType, resourceID, organizationID string) ([]*models.ResourcePermission, error)
	HasPermission(ctx context.Context, userID, resourceType, resourceID, permission, organizationID string) (bool, error)
}

// APIKeyRepositoryInterface defines the contract for API key operations
type APIKeyRepositoryInterface interface {
	Create(ctx context.Context, apiKey *models.APIKey) error
	GetByID(ctx context.Context, keyID, organizationID string) (*models.APIKey, error)
	GetByKeyHash(ctx context.Context, keyHash string) (*models.APIKey, error)
	List(ctx context.Context, userID, organizationID string, limit, offset int) ([]*models.APIKey, int, error)
	Update(ctx context.Context, apiKey *models.APIKey) error
	Delete(ctx context.Context, keyID, organizationID string) error
	UpdateLastUsed(ctx context.Context, keyID string) error
}

// SessionRepositoryInterface defines the contract for session operations
type SessionRepositoryInterface interface {
	Create(ctx context.Context, session *models.Session) error
	GetByID(ctx context.Context, sessionID string) (*models.Session, error)
	GetByTokenHash(ctx context.Context, tokenHash string) (*models.Session, error)
	GetUserSessions(ctx context.Context, userID, organizationID string) ([]*models.Session, error)
	Update(ctx context.Context, session *models.Session) error
	Delete(ctx context.Context, sessionID string) error
	DeleteExpired(ctx context.Context) error
	UpdateActivity(ctx context.Context, sessionID string) error
}

// TransactionManager provides transaction management capabilities
type TransactionManager interface {
	WithTransaction(ctx context.Context, fn func(tx *sql.Tx) error) error
}

// ListParams defines common parameters for list operations
type ListParams struct {
	Limit  int
	Offset int
	SortBy string
	Order  string // "asc" or "desc"
	Search string
}

// DefaultListParams returns default list parameters
func DefaultListParams() ListParams {
	return ListParams{
		Limit:  50,
		Offset: 0,
		SortBy: "created_at",
		Order:  "desc",
	}
}

// Validate validates list parameters
func (p *ListParams) Validate() {
	if p.Limit <= 0 || p.Limit > 1000 {
		p.Limit = 50
	}
	if p.Offset < 0 {
		p.Offset = 0
	}
	if p.Order != "asc" && p.Order != "desc" {
		p.Order = "desc"
	}
	if p.SortBy == "" {
		p.SortBy = "created_at"
	}
}
