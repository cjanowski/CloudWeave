package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"cloudweave/internal/models"

	"github.com/lib/pq"
)

type InfrastructureRepository struct {
	db *sql.DB
}

func NewInfrastructureRepository(db *sql.DB) *InfrastructureRepository {
	return &InfrastructureRepository{db: db}
}

// Create creates a new infrastructure resource in the database
func (r *InfrastructureRepository) Create(ctx context.Context, infra *models.Infrastructure) error {
	query := `
		INSERT INTO infrastructure (id, organization_id, name, type, provider, region, status, 
		                          specifications, cost_info, tags, external_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING created_at, updated_at`

	err := r.db.QueryRowContext(ctx, query,
		infra.ID,
		infra.OrganizationID,
		infra.Name,
		infra.Type,
		infra.Provider,
		infra.Region,
		infra.Status,
		infra.Specifications,
		infra.CostInfo,
		pq.Array(infra.Tags),
		infra.ExternalID,
	).Scan(&infra.CreatedAt, &infra.UpdatedAt)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			switch pqErr.Code {
			case "23505": // unique_violation
				return fmt.Errorf("infrastructure resource with this configuration already exists")
			case "23503": // foreign_key_violation
				return fmt.Errorf("invalid organization_id")
			}
		}
		return fmt.Errorf("failed to create infrastructure: %w", err)
	}

	return nil
}

// GetByID retrieves an infrastructure resource by its ID
func (r *InfrastructureRepository) GetByID(ctx context.Context, id string) (*models.Infrastructure, error) {
	infra := &models.Infrastructure{}
	query := `
		SELECT id, organization_id, name, type, provider, region, status, 
		       specifications, cost_info, tags, external_id, created_at, updated_at
		FROM infrastructure 
		WHERE id = $1`

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&infra.ID,
		&infra.OrganizationID,
		&infra.Name,
		&infra.Type,
		&infra.Provider,
		&infra.Region,
		&infra.Status,
		&infra.Specifications,
		&infra.CostInfo,
		pq.Array(&infra.Tags),
		&infra.ExternalID,
		&infra.CreatedAt,
		&infra.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("infrastructure resource with id %s not found", id)
		}
		return nil, fmt.Errorf("failed to get infrastructure by id: %w", err)
	}

	return infra, nil
}

// Update updates an existing infrastructure resource
func (r *InfrastructureRepository) Update(ctx context.Context, infra *models.Infrastructure) error {
	query := `
		UPDATE infrastructure 
		SET name = $2, type = $3, provider = $4, region = $5, status = $6,
		    specifications = $7, cost_info = $8, tags = $9, external_id = $10, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at`

	err := r.db.QueryRowContext(ctx, query,
		infra.ID,
		infra.Name,
		infra.Type,
		infra.Provider,
		infra.Region,
		infra.Status,
		infra.Specifications,
		infra.CostInfo,
		pq.Array(infra.Tags),
		infra.ExternalID,
	).Scan(&infra.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("infrastructure resource with id %s not found", infra.ID)
		}
		return fmt.Errorf("failed to update infrastructure: %w", err)
	}

	return nil
}

// Delete deletes an infrastructure resource by its ID
func (r *InfrastructureRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM infrastructure WHERE id = $1`
	
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete infrastructure: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("infrastructure resource with id %s not found", id)
	}

	return nil
}

// List retrieves infrastructure resources for an organization with pagination and filtering
func (r *InfrastructureRepository) List(ctx context.Context, orgID string, params ListParams) ([]*models.Infrastructure, error) {
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
		whereClause.WriteString(" OR type ILIKE $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex+1))
		whereClause.WriteString(" OR provider ILIKE $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex+2))
		whereClause.WriteString(")")
		searchPattern := "%" + params.Search + "%"
		args = append(args, searchPattern, searchPattern, searchPattern)
		argIndex += 3
	}

	// Validate sort column
	validSortColumns := map[string]bool{
		"name":       true,
		"type":       true,
		"provider":   true,
		"region":     true,
		"status":     true,
		"created_at": true,
		"updated_at": true,
	}
	if !validSortColumns[params.SortBy] {
		params.SortBy = "created_at"
	}

	query := fmt.Sprintf(`
		SELECT id, organization_id, name, type, provider, region, status, 
		       specifications, cost_info, tags, external_id, created_at, updated_at
		FROM infrastructure 
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
		return nil, fmt.Errorf("failed to list infrastructure: %w", err)
	}
	defer rows.Close()

	var infrastructures []*models.Infrastructure
	for rows.Next() {
		infra := &models.Infrastructure{}
		err := rows.Scan(
			&infra.ID,
			&infra.OrganizationID,
			&infra.Name,
			&infra.Type,
			&infra.Provider,
			&infra.Region,
			&infra.Status,
			&infra.Specifications,
			&infra.CostInfo,
			pq.Array(&infra.Tags),
			&infra.ExternalID,
			&infra.CreatedAt,
			&infra.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan infrastructure row: %w", err)
		}
		infrastructures = append(infrastructures, infra)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating infrastructure rows: %w", err)
	}

	return infrastructures, nil
}

// ListByProvider retrieves infrastructure resources by provider
func (r *InfrastructureRepository) ListByProvider(ctx context.Context, orgID, provider string, params ListParams) ([]*models.Infrastructure, error) {
	params.Validate()

	query := `
		SELECT id, organization_id, name, type, provider, region, status, 
		       specifications, cost_info, tags, external_id, created_at, updated_at
		FROM infrastructure 
		WHERE organization_id = $1 AND provider = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4`

	rows, err := r.db.QueryContext(ctx, query, orgID, provider, params.Limit, params.Offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list infrastructure by provider: %w", err)
	}
	defer rows.Close()

	var infrastructures []*models.Infrastructure
	for rows.Next() {
		infra := &models.Infrastructure{}
		err := rows.Scan(
			&infra.ID,
			&infra.OrganizationID,
			&infra.Name,
			&infra.Type,
			&infra.Provider,
			&infra.Region,
			&infra.Status,
			&infra.Specifications,
			&infra.CostInfo,
			pq.Array(&infra.Tags),
			&infra.ExternalID,
			&infra.CreatedAt,
			&infra.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan infrastructure row: %w", err)
		}
		infrastructures = append(infrastructures, infra)
	}

	return infrastructures, nil
}

// ListByStatus retrieves infrastructure resources by status
func (r *InfrastructureRepository) ListByStatus(ctx context.Context, orgID, status string, params ListParams) ([]*models.Infrastructure, error) {
	params.Validate()

	query := `
		SELECT id, organization_id, name, type, provider, region, status, 
		       specifications, cost_info, tags, external_id, created_at, updated_at
		FROM infrastructure 
		WHERE organization_id = $1 AND status = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4`

	rows, err := r.db.QueryContext(ctx, query, orgID, status, params.Limit, params.Offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list infrastructure by status: %w", err)
	}
	defer rows.Close()

	var infrastructures []*models.Infrastructure
	for rows.Next() {
		infra := &models.Infrastructure{}
		err := rows.Scan(
			&infra.ID,
			&infra.OrganizationID,
			&infra.Name,
			&infra.Type,
			&infra.Provider,
			&infra.Region,
			&infra.Status,
			&infra.Specifications,
			&infra.CostInfo,
			pq.Array(&infra.Tags),
			&infra.ExternalID,
			&infra.CreatedAt,
			&infra.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan infrastructure row: %w", err)
		}
		infrastructures = append(infrastructures, infra)
	}

	return infrastructures, nil
}

// UpdateStatus updates the status of an infrastructure resource
func (r *InfrastructureRepository) UpdateStatus(ctx context.Context, id, status string) error {
	query := `UPDATE infrastructure SET status = $2, updated_at = NOW() WHERE id = $1`
	
	result, err := r.db.ExecContext(ctx, query, id, status)
	if err != nil {
		return fmt.Errorf("failed to update infrastructure status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("infrastructure resource with id %s not found", id)
	}

	return nil
}

// GetByExternalID retrieves an infrastructure resource by its external ID
func (r *InfrastructureRepository) GetByExternalID(ctx context.Context, externalID string) (*models.Infrastructure, error) {
	infra := &models.Infrastructure{}
	query := `
		SELECT id, organization_id, name, type, provider, region, status, 
		       specifications, cost_info, tags, external_id, created_at, updated_at
		FROM infrastructure 
		WHERE external_id = $1`

	err := r.db.QueryRowContext(ctx, query, externalID).Scan(
		&infra.ID,
		&infra.OrganizationID,
		&infra.Name,
		&infra.Type,
		&infra.Provider,
		&infra.Region,
		&infra.Status,
		&infra.Specifications,
		&infra.CostInfo,
		pq.Array(&infra.Tags),
		&infra.ExternalID,
		&infra.CreatedAt,
		&infra.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("infrastructure resource with external_id %s not found", externalID)
		}
		return nil, fmt.Errorf("failed to get infrastructure by external_id: %w", err)
	}

	return infra, nil
}