package repositories

import (
	"database/sql"
)

// RepositoryManager provides centralized access to all repositories and transaction management
type RepositoryManager struct {
	// Repositories
	User           UserRepositoryInterface
	Organization   OrganizationRepositoryInterface
	Infrastructure InfrastructureRepositoryInterface
	Deployment     DeploymentRepositoryInterface
	Metric         MetricRepositoryInterface
	Alert          AlertRepositoryInterface
	AuditLog       AuditLogRepositoryInterface
	SecurityScan   SecurityScanRepositoryInterface
	Vulnerability  VulnerabilityRepositoryInterface

	// Transaction manager
	Transaction TransactionManager

	// Database connection
	db *sql.DB
}

// NewRepositoryManager creates a new repository manager with all repositories initialized
func NewRepositoryManager(db *sql.DB) *RepositoryManager {
	return &RepositoryManager{
		// Initialize repositories
		User:           NewUserRepository(db),
		Organization:   NewOrganizationRepository(db),
		Infrastructure: NewInfrastructureRepository(db),
		Deployment:     NewDeploymentRepository(db),
		Metric:         NewMetricRepository(db),
		Alert:          NewAlertRepository(db),
		AuditLog:       NewAuditLogRepository(db),
		SecurityScan:   NewSecurityScanRepository(db),
		Vulnerability:  NewVulnerabilityRepository(db),

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