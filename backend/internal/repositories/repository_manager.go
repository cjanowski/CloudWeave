package repositories

import (
	"database/sql"

	"github.com/jmoiron/sqlx"
)

// RepositoryManager provides centralized access to all repositories and transaction management
type RepositoryManager struct {
	// Repositories
	User                 UserRepositoryInterface
	Organization         OrganizationRepositoryInterface
	Infrastructure       InfrastructureRepositoryInterface
	Deployment           DeploymentRepositoryInterface
	Metric               MetricRepositoryInterface
	Alert                AlertRepositoryInterface
	AuditLog             AuditLogRepositoryInterface
	SecurityScan         SecurityScanRepositoryInterface
	Vulnerability        VulnerabilityRepositoryInterface
	ComplianceFramework  ComplianceFrameworkRepositoryInterface
	ComplianceControl    ComplianceControlRepositoryInterface
	ComplianceAssessment ComplianceAssessmentRepositoryInterface
	Role                 RoleRepositoryInterface
	UserRole             UserRoleRepositoryInterface
	ResourcePermission   ResourcePermissionRepositoryInterface
	APIKey               APIKeyRepositoryInterface
	Session              SessionRepositoryInterface
	CloudCredentials     *CloudCredentialsRepository
	DemoData             *DemoDataRepository

	// Transaction manager
	Transaction TransactionManager

	// Database connection
	db *sql.DB
}

// NewRepositoryManager creates a new repository manager with all repositories initialized
func NewRepositoryManager(db *sql.DB) *RepositoryManager {
	// Create sqlx.DB wrapper for repositories that need it
	sqlxDB := sqlx.NewDb(db, "postgres")
	return &RepositoryManager{
		// Initialize repositories
		User:                 NewUserRepository(db),
		Organization:         NewOrganizationRepository(db),
		Infrastructure:       NewInfrastructureRepository(db),
		Deployment:           NewDeploymentRepository(db),
		Metric:               NewMetricRepository(db),
		Alert:                NewAlertRepository(db),
		AuditLog:             NewAuditLogRepository(db),
		SecurityScan:         NewSecurityScanRepository(db),
		Vulnerability:        NewVulnerabilityRepository(db),
		ComplianceFramework:  NewComplianceFrameworkRepository(db),
		ComplianceControl:    NewComplianceControlRepository(db),
		ComplianceAssessment: NewComplianceAssessmentRepository(db),
		Role:                 NewRoleRepository(db),
		UserRole:             NewUserRoleRepository(db),
		ResourcePermission:   nil, // TODO: Implement ResourcePermissionRepository
		APIKey:               nil, // TODO: Implement APIKeyRepository
		Session:              nil, // TODO: Implement SessionRepository
		CloudCredentials:     NewCloudCredentialsRepository(db),
		DemoData:             NewDemoDataRepository(sqlxDB),

		// Initialize transaction manager
		Transaction: NewTransactionManager(db),

		// Store database connection
		db: db,
	}
}

// GetDB returns the underlying database connection
// This can be useful for custom queries or operations not covered by repositories
func (rm *RepositoryManager) GetDB() *sql.DB {
	return rm.db
}

// Health checks the health of the database connection
func (rm *RepositoryManager) Health() error {
	return rm.db.Ping()
}

// Close closes all database connections
func (rm *RepositoryManager) Close() error {
	return rm.db.Close()
}

// Stats returns database connection statistics
func (rm *RepositoryManager) Stats() sql.DBStats {
	return rm.db.Stats()
}
