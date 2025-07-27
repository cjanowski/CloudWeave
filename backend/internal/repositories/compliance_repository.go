package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"cloudweave/internal/models"

	"github.com/lib/pq"
)

// ComplianceFrameworkRepository handles compliance framework data operations
type ComplianceFrameworkRepository struct {
	db *sql.DB
}

// NewComplianceFrameworkRepository creates a new compliance framework repository
func NewComplianceFrameworkRepository(db *sql.DB) *ComplianceFrameworkRepository {
	return &ComplianceFrameworkRepository{db: db}
}

// Create creates a new compliance framework
func (r *ComplianceFrameworkRepository) Create(ctx context.Context, framework *models.ComplianceFrameworkConfig) error {
	configJSON, err := json.Marshal(framework.Configuration)
	if err != nil {
		return fmt.Errorf("failed to marshal configuration: %w", err)
	}

	query := `
		INSERT INTO compliance_frameworks (id, organization_id, framework, name, description, version, enabled, configuration, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err = r.db.ExecContext(ctx, query,
		framework.ID, framework.OrganizationID, framework.Framework, framework.Name,
		framework.Description, framework.Version, framework.Enabled, configJSON,
		framework.CreatedAt, framework.UpdatedAt)

	return err
}

// GetByID retrieves a compliance framework by ID
func (r *ComplianceFrameworkRepository) GetByID(ctx context.Context, organizationID, frameworkID string) (*models.ComplianceFrameworkConfig, error) {
	query := `
		SELECT id, organization_id, framework, name, description, version, enabled, configuration, created_at, updated_at
		FROM compliance_frameworks
		WHERE id = $1 AND organization_id = $2`

	var framework models.ComplianceFrameworkConfig
	var configJSON []byte

	err := r.db.QueryRowContext(ctx, query, frameworkID, organizationID).Scan(
		&framework.ID, &framework.OrganizationID, &framework.Framework, &framework.Name,
		&framework.Description, &framework.Version, &framework.Enabled, &configJSON,
		&framework.CreatedAt, &framework.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("compliance framework not found")
		}
		return nil, err
	}

	if err := json.Unmarshal(configJSON, &framework.Configuration); err != nil {
		return nil, fmt.Errorf("failed to unmarshal configuration: %w", err)
	}

	return &framework, nil
}

// List retrieves compliance frameworks for an organization
func (r *ComplianceFrameworkRepository) List(ctx context.Context, organizationID string, limit, offset int) ([]*models.ComplianceFrameworkConfig, int, error) {
	// Get total count
	countQuery := `SELECT COUNT(*) FROM compliance_frameworks WHERE organization_id = $1`
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, organizationID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get frameworks
	query := `
		SELECT id, organization_id, framework, name, description, version, enabled, configuration, created_at, updated_at
		FROM compliance_frameworks
		WHERE organization_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.QueryContext(ctx, query, organizationID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var frameworks []*models.ComplianceFrameworkConfig
	for rows.Next() {
		var framework models.ComplianceFrameworkConfig
		var configJSON []byte

		err := rows.Scan(
			&framework.ID, &framework.OrganizationID, &framework.Framework, &framework.Name,
			&framework.Description, &framework.Version, &framework.Enabled, &configJSON,
			&framework.CreatedAt, &framework.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}

		if err := json.Unmarshal(configJSON, &framework.Configuration); err != nil {
			return nil, 0, fmt.Errorf("failed to unmarshal configuration: %w", err)
		}

		frameworks = append(frameworks, &framework)
	}

	return frameworks, total, nil
}

// Update updates a compliance framework
func (r *ComplianceFrameworkRepository) Update(ctx context.Context, framework *models.ComplianceFrameworkConfig) error {
	configJSON, err := json.Marshal(framework.Configuration)
	if err != nil {
		return fmt.Errorf("failed to marshal configuration: %w", err)
	}

	query := `
		UPDATE compliance_frameworks
		SET name = $1, description = $2, version = $3, enabled = $4, configuration = $5, updated_at = $6
		WHERE id = $7 AND organization_id = $8`

	_, err = r.db.ExecContext(ctx, query,
		framework.Name, framework.Description, framework.Version, framework.Enabled,
		configJSON, framework.UpdatedAt, framework.ID, framework.OrganizationID)

	return err
}

// Delete deletes a compliance framework
func (r *ComplianceFrameworkRepository) Delete(ctx context.Context, organizationID, frameworkID string) error {
	query := `DELETE FROM compliance_frameworks WHERE id = $1 AND organization_id = $2`
	_, err := r.db.ExecContext(ctx, query, frameworkID, organizationID)
	return err
}

// ComplianceControlRepository handles compliance control data operations
type ComplianceControlRepository struct {
	db *sql.DB
}

// NewComplianceControlRepository creates a new compliance control repository
func NewComplianceControlRepository(db *sql.DB) *ComplianceControlRepository {
	return &ComplianceControlRepository{db: db}
}

// Create creates a new compliance control
func (r *ComplianceControlRepository) Create(ctx context.Context, control *models.ComplianceControl) error {
	query := `
		INSERT INTO compliance_controls (id, framework_id, control_id, title, description, category, subcategory,
			status, severity, automated_check, check_query, evidence, remediation, owner, due_date,
			last_checked, next_check, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`

	_, err := r.db.ExecContext(ctx, query,
		control.ID, control.FrameworkID, control.ControlID, control.Title, control.Description,
		control.Category, control.Subcategory, control.Status, control.Severity,
		control.AutomatedCheck, control.CheckQuery, pq.Array(control.Evidence),
		control.Remediation, control.Owner, control.DueDate, control.LastChecked,
		control.NextCheck, control.CreatedAt, control.UpdatedAt)

	return err
}

// GetByID retrieves a compliance control by ID
func (r *ComplianceControlRepository) GetByID(ctx context.Context, controlID string) (*models.ComplianceControl, error) {
	query := `
		SELECT id, framework_id, control_id, title, description, category, subcategory,
			status, severity, automated_check, check_query, evidence, remediation, owner, due_date,
			last_checked, next_check, created_at, updated_at
		FROM compliance_controls
		WHERE id = $1`

	var control models.ComplianceControl
	var evidence pq.StringArray

	err := r.db.QueryRowContext(ctx, query, controlID).Scan(
		&control.ID, &control.FrameworkID, &control.ControlID, &control.Title, &control.Description,
		&control.Category, &control.Subcategory, &control.Status, &control.Severity,
		&control.AutomatedCheck, &control.CheckQuery, &evidence, &control.Remediation,
		&control.Owner, &control.DueDate, &control.LastChecked, &control.NextCheck,
		&control.CreatedAt, &control.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("compliance control not found")
		}
		return nil, err
	}

	control.Evidence = []string(evidence)
	return &control, nil
}

// ListByFramework retrieves compliance controls for a framework
func (r *ComplianceControlRepository) ListByFramework(ctx context.Context, frameworkID string, limit, offset int) ([]*models.ComplianceControl, int, error) {
	// Get total count
	countQuery := `SELECT COUNT(*) FROM compliance_controls WHERE framework_id = $1`
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, frameworkID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get controls
	query := `
		SELECT id, framework_id, control_id, title, description, category, subcategory,
			status, severity, automated_check, check_query, evidence, remediation, owner, due_date,
			last_checked, next_check, created_at, updated_at
		FROM compliance_controls
		WHERE framework_id = $1
		ORDER BY category, subcategory, control_id
		LIMIT $2 OFFSET $3`

	rows, err := r.db.QueryContext(ctx, query, frameworkID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var controls []*models.ComplianceControl
	for rows.Next() {
		var control models.ComplianceControl
		var evidence pq.StringArray

		err := rows.Scan(
			&control.ID, &control.FrameworkID, &control.ControlID, &control.Title, &control.Description,
			&control.Category, &control.Subcategory, &control.Status, &control.Severity,
			&control.AutomatedCheck, &control.CheckQuery, &evidence, &control.Remediation,
			&control.Owner, &control.DueDate, &control.LastChecked, &control.NextCheck,
			&control.CreatedAt, &control.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}

		control.Evidence = []string(evidence)
		controls = append(controls, &control)
	}

	return controls, total, nil
}

// Update updates a compliance control
func (r *ComplianceControlRepository) Update(ctx context.Context, control *models.ComplianceControl) error {
	query := `
		UPDATE compliance_controls
		SET status = $1, evidence = $2, remediation = $3, owner = $4, due_date = $5,
			last_checked = $6, next_check = $7, updated_at = $8
		WHERE id = $9`

	_, err := r.db.ExecContext(ctx, query,
		control.Status, pq.Array(control.Evidence), control.Remediation,
		control.Owner, control.DueDate, control.LastChecked, control.NextCheck,
		control.UpdatedAt, control.ID)

	return err
}

// GetCountsByStatus retrieves control counts by status for a framework
func (r *ComplianceControlRepository) GetCountsByStatus(ctx context.Context, frameworkID string) (map[models.ComplianceControlStatus]int, error) {
	query := `
		SELECT status, COUNT(*)
		FROM compliance_controls
		WHERE framework_id = $1
		GROUP BY status`

	rows, err := r.db.QueryContext(ctx, query, frameworkID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	counts := make(map[models.ComplianceControlStatus]int)
	for rows.Next() {
		var status models.ComplianceControlStatus
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		counts[status] = count
	}

	return counts, nil
}

// GetCountsBySeverity retrieves control counts by severity for a framework
func (r *ComplianceControlRepository) GetCountsBySeverity(ctx context.Context, frameworkID string) (map[models.ComplianceSeverity]int, error) {
	query := `
		SELECT severity, COUNT(*)
		FROM compliance_controls
		WHERE framework_id = $1
		GROUP BY severity`

	rows, err := r.db.QueryContext(ctx, query, frameworkID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	counts := make(map[models.ComplianceSeverity]int)
	for rows.Next() {
		var severity models.ComplianceSeverity
		var count int
		if err := rows.Scan(&severity, &count); err != nil {
			return nil, err
		}
		counts[severity] = count
	}

	return counts, nil
}

// ComplianceAssessmentRepository handles compliance assessment data operations
type ComplianceAssessmentRepository struct {
	db *sql.DB
}

// NewComplianceAssessmentRepository creates a new compliance assessment repository
func NewComplianceAssessmentRepository(db *sql.DB) *ComplianceAssessmentRepository {
	return &ComplianceAssessmentRepository{db: db}
}

// Create creates a new compliance assessment
func (r *ComplianceAssessmentRepository) Create(ctx context.Context, assessment *models.ComplianceAssessment) error {
	var summaryJSON []byte
	var err error
	if assessment.Summary != nil {
		summaryJSON, err = json.Marshal(assessment.Summary)
		if err != nil {
			return fmt.Errorf("failed to marshal summary: %w", err)
		}
	}

	query := `
		INSERT INTO compliance_assessments (id, organization_id, framework_id, user_id, name, description,
			status, score, max_score, started_at, completed_at, due_date, summary, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`

	_, err = r.db.ExecContext(ctx, query,
		assessment.ID, assessment.OrganizationID, assessment.FrameworkID, assessment.UserID,
		assessment.Name, assessment.Description, assessment.Status, assessment.Score,
		assessment.MaxScore, assessment.StartedAt, assessment.CompletedAt, assessment.DueDate,
		summaryJSON, assessment.CreatedAt, assessment.UpdatedAt)

	return err
}

// GetByID retrieves a compliance assessment by ID
func (r *ComplianceAssessmentRepository) GetByID(ctx context.Context, organizationID, assessmentID string) (*models.ComplianceAssessment, error) {
	query := `
		SELECT id, organization_id, framework_id, user_id, name, description,
			status, score, max_score, started_at, completed_at, due_date, summary, created_at, updated_at
		FROM compliance_assessments
		WHERE id = $1 AND organization_id = $2`

	var assessment models.ComplianceAssessment
	var summaryJSON []byte

	err := r.db.QueryRowContext(ctx, query, assessmentID, organizationID).Scan(
		&assessment.ID, &assessment.OrganizationID, &assessment.FrameworkID, &assessment.UserID,
		&assessment.Name, &assessment.Description, &assessment.Status, &assessment.Score,
		&assessment.MaxScore, &assessment.StartedAt, &assessment.CompletedAt, &assessment.DueDate,
		&summaryJSON, &assessment.CreatedAt, &assessment.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("compliance assessment not found")
		}
		return nil, err
	}

	if summaryJSON != nil {
		if err := json.Unmarshal(summaryJSON, &assessment.Summary); err != nil {
			return nil, fmt.Errorf("failed to unmarshal summary: %w", err)
		}
	}

	return &assessment, nil
}

// List retrieves compliance assessments for an organization
func (r *ComplianceAssessmentRepository) List(ctx context.Context, organizationID string, limit, offset int) ([]*models.ComplianceAssessment, int, error) {
	// Get total count
	countQuery := `SELECT COUNT(*) FROM compliance_assessments WHERE organization_id = $1`
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, organizationID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get assessments
	query := `
		SELECT id, organization_id, framework_id, user_id, name, description,
			status, score, max_score, started_at, completed_at, due_date, summary, created_at, updated_at
		FROM compliance_assessments
		WHERE organization_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.QueryContext(ctx, query, organizationID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var assessments []*models.ComplianceAssessment
	for rows.Next() {
		var assessment models.ComplianceAssessment
		var summaryJSON []byte

		err := rows.Scan(
			&assessment.ID, &assessment.OrganizationID, &assessment.FrameworkID, &assessment.UserID,
			&assessment.Name, &assessment.Description, &assessment.Status, &assessment.Score,
			&assessment.MaxScore, &assessment.StartedAt, &assessment.CompletedAt, &assessment.DueDate,
			&summaryJSON, &assessment.CreatedAt, &assessment.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}

		if summaryJSON != nil {
			if err := json.Unmarshal(summaryJSON, &assessment.Summary); err != nil {
				return nil, 0, fmt.Errorf("failed to unmarshal summary: %w", err)
			}
		}

		assessments = append(assessments, &assessment)
	}

	return assessments, total, nil
}

// Update updates a compliance assessment
func (r *ComplianceAssessmentRepository) Update(ctx context.Context, assessment *models.ComplianceAssessment) error {
	var summaryJSON []byte
	var err error
	if assessment.Summary != nil {
		summaryJSON, err = json.Marshal(assessment.Summary)
		if err != nil {
			return fmt.Errorf("failed to marshal summary: %w", err)
		}
	}

	query := `
		UPDATE compliance_assessments
		SET status = $1, score = $2, started_at = $3, completed_at = $4, summary = $5, updated_at = $6
		WHERE id = $7 AND organization_id = $8`

	_, err = r.db.ExecContext(ctx, query,
		assessment.Status, assessment.Score, assessment.StartedAt, assessment.CompletedAt,
		summaryJSON, assessment.UpdatedAt, assessment.ID, assessment.OrganizationID)

	return err
}