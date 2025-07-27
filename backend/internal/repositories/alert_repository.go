package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"cloudweave/internal/models"

	"github.com/lib/pq"
)

type AlertRepository struct {
	db *sql.DB
}

func NewAlertRepository(db *sql.DB) *AlertRepository {
	return &AlertRepository{db: db}
}

// Create creates a new alert in the database
func (r *AlertRepository) Create(ctx context.Context, alert *models.Alert) error {
	query := `
		INSERT INTO alerts (id, organization_id, type, severity, title, message, resource_id, resource_type)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING created_at, updated_at`

	err := r.db.QueryRowContext(ctx, query,
		alert.ID,
		alert.OrganizationID,
		alert.Type,
		alert.Severity,
		alert.Title,
		alert.Message,
		alert.ResourceID,
		alert.ResourceType,
	).Scan(&alert.CreatedAt, &alert.UpdatedAt)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			switch pqErr.Code {
			case "23503": // foreign_key_violation
				return fmt.Errorf("invalid organization_id")
			}
		}
		return fmt.Errorf("failed to create alert: %w", err)
	}

	return nil
}

// GetByID retrieves an alert by its ID
func (r *AlertRepository) GetByID(ctx context.Context, id string) (*models.Alert, error) {
	alert := &models.Alert{}
	query := `
		SELECT id, organization_id, type, severity, title, message, resource_id, resource_type,
		       acknowledged, acknowledged_by, acknowledged_at, created_at, updated_at
		FROM alerts 
		WHERE id = $1`

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&alert.ID,
		&alert.OrganizationID,
		&alert.Type,
		&alert.Severity,
		&alert.Title,
		&alert.Message,
		&alert.ResourceID,
		&alert.ResourceType,
		&alert.Acknowledged,
		&alert.AcknowledgedBy,
		&alert.AcknowledgedAt,
		&alert.CreatedAt,
		&alert.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("alert with id %s not found", id)
		}
		return nil, fmt.Errorf("failed to get alert by id: %w", err)
	}

	return alert, nil
}

// Update updates an existing alert
func (r *AlertRepository) Update(ctx context.Context, alert *models.Alert) error {
	query := `
		UPDATE alerts 
		SET type = $2, severity = $3, title = $4, message = $5, resource_id = $6, 
		    resource_type = $7, acknowledged = $8, acknowledged_by = $9, 
		    acknowledged_at = $10, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at`

	err := r.db.QueryRowContext(ctx, query,
		alert.ID,
		alert.Type,
		alert.Severity,
		alert.Title,
		alert.Message,
		alert.ResourceID,
		alert.ResourceType,
		alert.Acknowledged,
		alert.AcknowledgedBy,
		alert.AcknowledgedAt,
	).Scan(&alert.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("alert with id %s not found", alert.ID)
		}
		return fmt.Errorf("failed to update alert: %w", err)
	}

	return nil
}

// Delete deletes an alert by its ID
func (r *AlertRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM alerts WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete alert: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("alert with id %s not found", id)
	}

	return nil
}

// List retrieves alerts for an organization with pagination and filtering
func (r *AlertRepository) List(ctx context.Context, orgID string, params ListParams) ([]*models.Alert, error) {
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
		whereClause.WriteString(" AND (title ILIKE $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex))
		whereClause.WriteString(" OR message ILIKE $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex+1))
		whereClause.WriteString(" OR type ILIKE $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex+2))
		whereClause.WriteString(")")
		searchPattern := "%" + params.Search + "%"
		args = append(args, searchPattern, searchPattern, searchPattern)
		argIndex += 3
	}

	// Validate sort column
	validSortColumns := map[string]bool{
		"type":            true,
		"severity":        true,
		"title":           true,
		"acknowledged":    true,
		"created_at":      true,
		"updated_at":      true,
		"acknowledged_at": true,
	}
	if !validSortColumns[params.SortBy] {
		params.SortBy = "created_at"
	}

	query := fmt.Sprintf(`
		SELECT id, organization_id, type, severity, title, message, resource_id, resource_type,
		       acknowledged, acknowledged_by, acknowledged_at, created_at, updated_at
		FROM alerts 
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
		return nil, fmt.Errorf("failed to list alerts: %w", err)
	}
	defer rows.Close()

	var alerts []*models.Alert
	for rows.Next() {
		alert := &models.Alert{}
		err := rows.Scan(
			&alert.ID,
			&alert.OrganizationID,
			&alert.Type,
			&alert.Severity,
			&alert.Title,
			&alert.Message,
			&alert.ResourceID,
			&alert.ResourceType,
			&alert.Acknowledged,
			&alert.AcknowledgedBy,
			&alert.AcknowledgedAt,
			&alert.CreatedAt,
			&alert.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan alert row: %w", err)
		}
		alerts = append(alerts, alert)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating alert rows: %w", err)
	}

	return alerts, nil
}

// Query retrieves alerts based on query parameters
func (r *AlertRepository) Query(ctx context.Context, orgID string, query models.AlertQuery) ([]*models.Alert, error) {
	var whereClause strings.Builder
	var args []interface{}
	argIndex := 1

	whereClause.WriteString("WHERE organization_id = $")
	whereClause.WriteString(fmt.Sprintf("%d", argIndex))
	args = append(args, orgID)
	argIndex++

	if query.Type != nil {
		whereClause.WriteString(" AND type = $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex))
		args = append(args, *query.Type)
		argIndex++
	}

	if query.Severity != nil {
		whereClause.WriteString(" AND severity = $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex))
		args = append(args, *query.Severity)
		argIndex++
	}

	if query.ResourceID != nil {
		whereClause.WriteString(" AND resource_id = $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex))
		args = append(args, *query.ResourceID)
		argIndex++
	}

	if query.ResourceType != nil {
		whereClause.WriteString(" AND resource_type = $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex))
		args = append(args, *query.ResourceType)
		argIndex++
	}

	if query.Acknowledged != nil {
		whereClause.WriteString(" AND acknowledged = $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex))
		args = append(args, *query.Acknowledged)
		argIndex++
	}

	// Set default values if not provided
	limit := query.Limit
	if limit <= 0 || limit > 1000 {
		limit = 50
	}

	offset := query.Offset
	if offset < 0 {
		offset = 0
	}

	sqlQuery := fmt.Sprintf(`
		SELECT id, organization_id, type, severity, title, message, resource_id, resource_type,
		       acknowledged, acknowledged_by, acknowledged_at, created_at, updated_at
		FROM alerts 
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`,
		whereClause.String(),
		argIndex,
		argIndex+1,
	)

	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, sqlQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query alerts: %w", err)
	}
	defer rows.Close()

	var alerts []*models.Alert
	for rows.Next() {
		alert := &models.Alert{}
		err := rows.Scan(
			&alert.ID,
			&alert.OrganizationID,
			&alert.Type,
			&alert.Severity,
			&alert.Title,
			&alert.Message,
			&alert.ResourceID,
			&alert.ResourceType,
			&alert.Acknowledged,
			&alert.AcknowledgedBy,
			&alert.AcknowledgedAt,
			&alert.CreatedAt,
			&alert.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan alert row: %w", err)
		}
		alerts = append(alerts, alert)
	}

	return alerts, nil
}

// Acknowledge acknowledges an alert
func (r *AlertRepository) Acknowledge(ctx context.Context, id, userID string) error {
	query := `
		UPDATE alerts 
		SET acknowledged = true, acknowledged_by = $2, acknowledged_at = NOW(), updated_at = NOW()
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to acknowledge alert: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("alert with id %s not found", id)
	}

	return nil
}

// ListUnacknowledged retrieves unacknowledged alerts for an organization
func (r *AlertRepository) ListUnacknowledged(ctx context.Context, orgID string, params ListParams) ([]*models.Alert, error) {
	params.Validate()

	query := `
		SELECT id, organization_id, type, severity, title, message, resource_id, resource_type,
		       acknowledged, acknowledged_by, acknowledged_at, created_at, updated_at
		FROM alerts 
		WHERE organization_id = $1 AND acknowledged = false
		ORDER BY severity DESC, created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.QueryContext(ctx, query, orgID, params.Limit, params.Offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list unacknowledged alerts: %w", err)
	}
	defer rows.Close()

	var alerts []*models.Alert
	for rows.Next() {
		alert := &models.Alert{}
		err := rows.Scan(
			&alert.ID,
			&alert.OrganizationID,
			&alert.Type,
			&alert.Severity,
			&alert.Title,
			&alert.Message,
			&alert.ResourceID,
			&alert.ResourceType,
			&alert.Acknowledged,
			&alert.AcknowledgedBy,
			&alert.AcknowledgedAt,
			&alert.CreatedAt,
			&alert.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan alert row: %w", err)
		}
		alerts = append(alerts, alert)
	}

	return alerts, nil
}
