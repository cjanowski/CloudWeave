package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"cloudweave/internal/models"
)

// SecurityScanRepository handles security scan data operations
type SecurityScanRepository struct {
	db *sql.DB
}

// NewSecurityScanRepository creates a new security scan repository
func NewSecurityScanRepository(db *sql.DB) *SecurityScanRepository {
	return &SecurityScanRepository{db: db}
}

// Create creates a new security scan
func (r *SecurityScanRepository) Create(ctx context.Context, scan *models.SecurityScan) error {
	configJSON, err := json.Marshal(scan.Configuration)
	if err != nil {
		return fmt.Errorf("failed to marshal configuration: %w", err)
	}

	var summaryJSON []byte
	if scan.Summary != nil {
		summaryJSON, err = json.Marshal(scan.Summary)
		if err != nil {
			return fmt.Errorf("failed to marshal summary: %w", err)
		}
	}

	query := `
		INSERT INTO security_scans (
			id, organization_id, user_id, name, type, status, target_type, target_id, target_name,
			configuration, progress, started_at, completed_at, duration, error_message, summary,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
	`

	_, err = r.db.ExecContext(ctx, query,
		scan.ID, scan.OrganizationID, scan.UserID, scan.Name, scan.Type, scan.Status,
		scan.TargetType, scan.TargetID, scan.TargetName, configJSON, scan.Progress,
		scan.StartedAt, scan.CompletedAt, scan.Duration, scan.ErrorMessage, summaryJSON,
		scan.CreatedAt, scan.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create security scan: %w", err)
	}

	return nil
}

// GetByID retrieves a security scan by ID
func (r *SecurityScanRepository) GetByID(ctx context.Context, orgID, id string) (*models.SecurityScan, error) {
	query := `
		SELECT id, organization_id, user_id, name, type, status, target_type, target_id, target_name,
			   configuration, progress, started_at, completed_at, duration, error_message, summary,
			   created_at, updated_at
		FROM security_scans
		WHERE id = $1 AND organization_id = $2
	`

	row := r.db.QueryRowContext(ctx, query, id, orgID)

	scan := &models.SecurityScan{}
	var configJSON, summaryJSON []byte

	err := row.Scan(
		&scan.ID, &scan.OrganizationID, &scan.UserID, &scan.Name, &scan.Type, &scan.Status,
		&scan.TargetType, &scan.TargetID, &scan.TargetName, &configJSON, &scan.Progress,
		&scan.StartedAt, &scan.CompletedAt, &scan.Duration, &scan.ErrorMessage, &summaryJSON,
		&scan.CreatedAt, &scan.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("security scan not found")
		}
		return nil, fmt.Errorf("failed to get security scan: %w", err)
	}

	// Unmarshal configuration
	if len(configJSON) > 0 {
		if err := json.Unmarshal(configJSON, &scan.Configuration); err != nil {
			return nil, fmt.Errorf("failed to unmarshal configuration: %w", err)
		}
	}

	// Unmarshal summary
	if len(summaryJSON) > 0 {
		scan.Summary = &models.ScanSummary{}
		if err := json.Unmarshal(summaryJSON, scan.Summary); err != nil {
			return nil, fmt.Errorf("failed to unmarshal summary: %w", err)
		}
	}

	return scan, nil
}

// Update updates a security scan
func (r *SecurityScanRepository) Update(ctx context.Context, scan *models.SecurityScan) error {
	configJSON, err := json.Marshal(scan.Configuration)
	if err != nil {
		return fmt.Errorf("failed to marshal configuration: %w", err)
	}

	var summaryJSON []byte
	if scan.Summary != nil {
		summaryJSON, err = json.Marshal(scan.Summary)
		if err != nil {
			return fmt.Errorf("failed to marshal summary: %w", err)
		}
	}

	query := `
		UPDATE security_scans SET
			name = $2, type = $3, status = $4, target_type = $5, target_id = $6, target_name = $7,
			configuration = $8, progress = $9, started_at = $10, completed_at = $11, duration = $12,
			error_message = $13, summary = $14, updated_at = $15
		WHERE id = $1
	`

	_, err = r.db.ExecContext(ctx, query,
		scan.ID, scan.Name, scan.Type, scan.Status, scan.TargetType, scan.TargetID, scan.TargetName,
		configJSON, scan.Progress, scan.StartedAt, scan.CompletedAt, scan.Duration,
		scan.ErrorMessage, summaryJSON, scan.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update security scan: %w", err)
	}

	return nil
}

// Delete deletes a security scan
func (r *SecurityScanRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM security_scans WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete security scan: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("security scan not found")
	}

	return nil
}

// List retrieves security scans for an organization with pagination
func (r *SecurityScanRepository) List(ctx context.Context, orgID string, limit, offset int) ([]*models.SecurityScan, int, error) {
	// Get total count
	countQuery := `SELECT COUNT(*) FROM security_scans WHERE organization_id = $1`
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, orgID).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get total count: %w", err)
	}

	// Get scans
	query := `
		SELECT id, organization_id, user_id, name, type, status, target_type, target_id, target_name,
			   configuration, progress, started_at, completed_at, duration, error_message, summary,
			   created_at, updated_at
		FROM security_scans
		WHERE organization_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, orgID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list security scans: %w", err)
	}
	defer rows.Close()

	var scans []*models.SecurityScan
	for rows.Next() {
		scan := &models.SecurityScan{}
		var configJSON, summaryJSON []byte

		err := rows.Scan(
			&scan.ID, &scan.OrganizationID, &scan.UserID, &scan.Name, &scan.Type, &scan.Status,
			&scan.TargetType, &scan.TargetID, &scan.TargetName, &configJSON, &scan.Progress,
			&scan.StartedAt, &scan.CompletedAt, &scan.Duration, &scan.ErrorMessage, &summaryJSON,
			&scan.CreatedAt, &scan.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan row: %w", err)
		}

		// Unmarshal configuration
		if len(configJSON) > 0 {
			if err := json.Unmarshal(configJSON, &scan.Configuration); err != nil {
				return nil, 0, fmt.Errorf("failed to unmarshal configuration: %w", err)
			}
		}

		// Unmarshal summary
		if len(summaryJSON) > 0 {
			scan.Summary = &models.ScanSummary{}
			if err := json.Unmarshal(summaryJSON, scan.Summary); err != nil {
				return nil, 0, fmt.Errorf("failed to unmarshal summary: %w", err)
			}
		}

		scans = append(scans, scan)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("failed to iterate rows: %w", err)
	}

	return scans, total, nil
}

// GetRecentCount gets the count of scans created in the last N days
func (r *SecurityScanRepository) GetRecentCount(ctx context.Context, orgID string, days int) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM security_scans
		WHERE organization_id = $1 AND created_at >= $2
	`

	cutoffDate := time.Now().AddDate(0, 0, -days)
	var count int
	err := r.db.QueryRowContext(ctx, query, orgID, cutoffDate).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get recent scan count: %w", err)
	}

	return count, nil
}
