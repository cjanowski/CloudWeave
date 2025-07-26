package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"cloudweave/internal/models"

	"github.com/lib/pq"
)

type DeploymentRepository struct {
	db *sql.DB
}

func NewDeploymentRepository(db *sql.DB) *DeploymentRepository {
	return &DeploymentRepository{db: db}
}

// Create creates a new deployment in the database
func (r *DeploymentRepository) Create(ctx context.Context, deployment *models.Deployment) error {
	query := `
		INSERT INTO deployments (id, organization_id, name, application, version, environment, 
		                        status, progress, configuration, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING created_at, updated_at`

	err := r.db.QueryRowContext(ctx, query,
		deployment.ID,
		deployment.OrganizationID,
		deployment.Name,
		deployment.Application,
		deployment.Version,
		deployment.Environment,
		deployment.Status,
		deployment.Progress,
		deployment.Configuration,
		deployment.CreatedBy,
	).Scan(&deployment.CreatedAt, &deployment.UpdatedAt)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			switch pqErr.Code {
			case "23503": // foreign_key_violation
				return fmt.Errorf("invalid organization_id or created_by user_id")
			}
		}
		return fmt.Errorf("failed to create deployment: %w", err)
	}

	return nil
}

// GetByID retrieves a deployment by its ID
func (r *DeploymentRepository) GetByID(ctx context.Context, id string) (*models.Deployment, error) {
	deployment := &models.Deployment{}
	query := `
		SELECT id, organization_id, name, application, version, environment, status, 
		       progress, configuration, started_at, completed_at, created_by, created_at, updated_at
		FROM deployments 
		WHERE id = $1`

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&deployment.ID,
		&deployment.OrganizationID,
		&deployment.Name,
		&deployment.Application,
		&deployment.Version,
		&deployment.Environment,
		&deployment.Status,
		&deployment.Progress,
		&deployment.Configuration,
		&deployment.StartedAt,
		&deployment.CompletedAt,
		&deployment.CreatedBy,
		&deployment.CreatedAt,
		&deployment.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("deployment with id %s not found", id)
		}
		return nil, fmt.Errorf("failed to get deployment by id: %w", err)
	}

	return deployment, nil
}

// Update updates an existing deployment
func (r *DeploymentRepository) Update(ctx context.Context, deployment *models.Deployment) error {
	query := `
		UPDATE deployments 
		SET name = $2, application = $3, version = $4, environment = $5, status = $6,
		    progress = $7, configuration = $8, started_at = $9, completed_at = $10, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at`

	err := r.db.QueryRowContext(ctx, query,
		deployment.ID,
		deployment.Name,
		deployment.Application,
		deployment.Version,
		deployment.Environment,
		deployment.Status,
		deployment.Progress,
		deployment.Configuration,
		deployment.StartedAt,
		deployment.CompletedAt,
	).Scan(&deployment.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("deployment with id %s not found", deployment.ID)
		}
		return fmt.Errorf("failed to update deployment: %w", err)
	}

	return nil
}

// Delete deletes a deployment by its ID
func (r *DeploymentRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM deployments WHERE id = $1`
	
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete deployment: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("deployment with id %s not found", id)
	}

	return nil
}

// List retrieves deployments for an organization with pagination and filtering
func (r *DeploymentRepository) List(ctx context.Context, orgID string, params ListParams) ([]*models.Deployment, error) {
	params.Validate()

	var whereClause strings.Builder
	var args []interface{}
	argIndex := 1

	whereClause.WriteString("WHERE organization_id = $")
	whereClause.WriteString(fmt.Sprintf("%d", argIndex))
	args = append(args, orgID)
	argIndex++

	// Add search filter if provided
	if params.Search != "" {
		whereClause.WriteString(" AND (name ILIKE $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex))
		whereClause.WriteString(" OR application ILIKE $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex+1))
		whereClause.WriteString(" OR environment ILIKE $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex+2))
		whereClause.WriteString(")")
		searchPattern := "%" + params.Search + "%"
		args = append(args, searchPattern, searchPattern, searchPattern)
		argIndex += 3
	}

	// Validate sort column
	validSortColumns := map[string]bool{
		"name":        true,
		"application": true,
		"version":     true,
		"environment": true,
		"status":      true,
		"progress":    true,
		"created_at":  true,
		"updated_at":  true,
		"started_at":  true,
		"completed_at": true,
	}
	if !validSortColumns[params.SortBy] {
		params.SortBy = "created_at"
	}

	query := fmt.Sprintf(`
		SELECT id, organization_id, name, application, version, environment, status, 
		       progress, configuration, started_at, completed_at, created_by, created_at, updated_at
		FROM deployments 
		%s
		ORDER BY %s %s
		LIMIT $%d OFFSET $%d`,
		whereClause.String(),
		params.SortBy,
		params.Order,
		argIndex,
		argIndex+1,
	)

	args = append(args, params.Limit, params.Offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list deployments: %w", err)
	}
	defer rows.Close()

	var deployments []*models.Deployment
	for rows.Next() {
		deployment := &models.Deployment{}
		err := rows.Scan(
			&deployment.ID,
			&deployment.OrganizationID,
			&deployment.Name,
			&deployment.Application,
			&deployment.Version,
			&deployment.Environment,
			&deployment.Status,
			&deployment.Progress,
			&deployment.Configuration,
			&deployment.StartedAt,
			&deployment.CompletedAt,
			&deployment.CreatedBy,
			&deployment.CreatedAt,
			&deployment.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan deployment row: %w", err)
		}
		deployments = append(deployments, deployment)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating deployment rows: %w", err)
	}

	return deployments, nil
}

// ListByEnvironment retrieves deployments by environment
func (r *DeploymentRepository) ListByEnvironment(ctx context.Context, orgID, environment string, params ListParams) ([]*models.Deployment, error) {
	params.Validate()

	query := `
		SELECT id, organization_id, name, application, version, environment, status, 
		       progress, configuration, started_at, completed_at, created_by, created_at, updated_at
		FROM deployments 
		WHERE organization_id = $1 AND environment = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4`

	rows, err := r.db.QueryContext(ctx, query, orgID, environment, params.Limit, params.Offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list deployments by environment: %w", err)
	}
	defer rows.Close()

	var deployments []*models.Deployment
	for rows.Next() {
		deployment := &models.Deployment{}
		err := rows.Scan(
			&deployment.ID,
			&deployment.OrganizationID,
			&deployment.Name,
			&deployment.Application,
			&deployment.Version,
			&deployment.Environment,
			&deployment.Status,
			&deployment.Progress,
			&deployment.Configuration,
			&deployment.StartedAt,
			&deployment.CompletedAt,
			&deployment.CreatedBy,
			&deployment.CreatedAt,
			&deployment.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan deployment row: %w", err)
		}
		deployments = append(deployments, deployment)
	}

	return deployments, nil
}

// ListByStatus retrieves deployments by status
func (r *DeploymentRepository) ListByStatus(ctx context.Context, orgID, status string, params ListParams) ([]*models.Deployment, error) {
	params.Validate()

	query := `
		SELECT id, organization_id, name, application, version, environment, status, 
		       progress, configuration, started_at, completed_at, created_by, created_at, updated_at
		FROM deployments 
		WHERE organization_id = $1 AND status = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4`

	rows, err := r.db.QueryContext(ctx, query, orgID, status, params.Limit, params.Offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list deployments by status: %w", err)
	}
	defer rows.Close()

	var deployments []*models.Deployment
	for rows.Next() {
		deployment := &models.Deployment{}
		err := rows.Scan(
			&deployment.ID,
			&deployment.OrganizationID,
			&deployment.Name,
			&deployment.Application,
			&deployment.Version,
			&deployment.Environment,
			&deployment.Status,
			&deployment.Progress,
			&deployment.Configuration,
			&deployment.StartedAt,
			&deployment.CompletedAt,
			&deployment.CreatedBy,
			&deployment.CreatedAt,
			&deployment.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan deployment row: %w", err)
		}
		deployments = append(deployments, deployment)
	}

	return deployments, nil
}

// UpdateStatus updates the status of a deployment
func (r *DeploymentRepository) UpdateStatus(ctx context.Context, id, status string) error {
	query := `UPDATE deployments SET status = $2, updated_at = NOW() WHERE id = $1`
	
	result, err := r.db.ExecContext(ctx, query, id, status)
	if err != nil {
		return fmt.Errorf("failed to update deployment status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("deployment with id %s not found", id)
	}

	return nil
}

// UpdateProgress updates the progress of a deployment
func (r *DeploymentRepository) UpdateProgress(ctx context.Context, id string, progress int) error {
	query := `UPDATE deployments SET progress = $2, updated_at = NOW() WHERE id = $1`
	
	result, err := r.db.ExecContext(ctx, query, id, progress)
	if err != nil {
		return fmt.Errorf("failed to update deployment progress: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("deployment with id %s not found", id)
	}

	return nil
}