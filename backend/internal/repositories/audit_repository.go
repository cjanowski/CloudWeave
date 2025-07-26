package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"cloudweave/internal/models"

	"github.com/lib/pq"
)

type AuditLogRepository struct {
	db *sql.DB
}

func NewAuditLogRepository(db *sql.DB) *AuditLogRepository {
	return &AuditLogRepository{db: db}
}

// Create creates a new audit log entry in the database
func (r *AuditLogRepository) Create(ctx context.Context, log *models.AuditLog) error {
	query := `
		INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, 
		                       resource_id, details, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING created_at`

	err := r.db.QueryRowContext(ctx, query,
		log.ID,
		log.OrganizationID,
		log.UserID,
		log.Action,
		log.ResourceType,
		log.ResourceID,
		log.Details,
		log.IPAddress,
		log.UserAgent,
	).Scan(&log.CreatedAt)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			switch pqErr.Code {
			case "23503": // foreign_key_violation
				return fmt.Errorf("invalid organization_id or user_id")
			}
		}
		return fmt.Errorf("failed to create audit log: %w", err)
	}

	return nil
}

// GetByID retrieves an audit log entry by its ID
func (r *AuditLogRepository) GetByID(ctx context.Context, id string) (*models.AuditLog, error) {
	log := &models.AuditLog{}
	query := `
		SELECT id, organization_id, user_id, action, resource_type, resource_id, 
		       details, ip_address, user_agent, created_at
		FROM audit_logs 
		WHERE id = $1`

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&log.ID,
		&log.OrganizationID,
		&log.UserID,
		&log.Action,
		&log.ResourceType,
		&log.ResourceID,
		&log.Details,
		&log.IPAddress,
		&log.UserAgent,
		&log.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("audit log with id %s not found", id)
		}
		return nil, fmt.Errorf("failed to get audit log by id: %w", err)
	}

	return log, nil
}

// Query retrieves audit logs based on query parameters
func (r *AuditLogRepository) Query(ctx context.Context, orgID string, query models.AuditLogQuery) ([]*models.AuditLog, error) {
	var whereClause strings.Builder
	var args []interface{}
	argIndex := 1

	whereClause.WriteString("WHERE organization_id = $")
	whereClause.WriteString(fmt.Sprintf("%d", argIndex))
	whereClause.WriteString(" AND created_at >= $")
	whereClause.WriteString(fmt.Sprintf("%d", argIndex+1))
	whereClause.WriteString(" AND created_at <= $")
	whereClause.WriteString(fmt.Sprintf("%d", argIndex+2))
	args = append(args, orgID, query.StartTime, query.EndTime)
	argIndex += 3

	if query.UserID != nil {
		whereClause.WriteString(" AND user_id = $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex))
		args = append(args, *query.UserID)
		argIndex++
	}

	if query.Action != nil {
		whereClause.WriteString(" AND action = $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex))
		args = append(args, *query.Action)
		argIndex++
	}

	if query.ResourceType != nil {
		whereClause.WriteString(" AND resource_type = $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex))
		args = append(args, *query.ResourceType)
		argIndex++
	}

	if query.ResourceID != nil {
		whereClause.WriteString(" AND resource_id = $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex))
		args = append(args, *query.ResourceID)
		argIndex++
	}

	// Set default values if not provided
	limit := query.Limit
	if limit <= 0 || limit > 10000 {
		limit = 1000
	}

	offset := query.Offset
	if offset < 0 {
		offset = 0
	}

	sqlQuery := fmt.Sprintf(`
		SELECT id, organization_id, user_id, action, resource_type, resource_id, 
		       details, ip_address, user_agent, created_at
		FROM audit_logs 
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
		return nil, fmt.Errorf("failed to query audit logs: %w", err)
	}
	defer rows.Close()

	var logs []*models.AuditLog
	for rows.Next() {
		log := &models.AuditLog{}
		err := rows.Scan(
			&log.ID,
			&log.OrganizationID,
			&log.UserID,
			&log.Action,
			&log.ResourceType,
			&log.ResourceID,
			&log.Details,
			&log.IPAddress,
			&log.UserAgent,
			&log.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan audit log row: %w", err)
		}
		logs = append(logs, log)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating audit log rows: %w", err)
	}

	return logs, nil
}

// Delete deletes an audit log entry by its ID
func (r *AuditLogRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM audit_logs WHERE id = $1`
	
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete audit log: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("audit log with id %s not found", id)
	}

	return nil
}

// DeleteOlderThan deletes audit logs older than the specified cutoff time
func (r *AuditLogRepository) DeleteOlderThan(ctx context.Context, cutoffTime string) error {
	cutoff, err := time.Parse(time.RFC3339, cutoffTime)
	if err != nil {
		return fmt.Errorf("invalid cutoff time format: %w", err)
	}

	query := `DELETE FROM audit_logs WHERE created_at < $1`
	
	result, err := r.db.ExecContext(ctx, query, cutoff)
	if err != nil {
		return fmt.Errorf("failed to delete old audit logs: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	fmt.Printf("Deleted %d old audit logs\n", rowsAffected)
	return nil
}

// GetActionSummary retrieves a summary of actions performed within a time range
func (r *AuditLogRepository) GetActionSummary(ctx context.Context, orgID string, startTime, endTime time.Time) (map[string]int, error) {
	query := `
		SELECT action, COUNT(*) as count
		FROM audit_logs 
		WHERE organization_id = $1 AND created_at >= $2 AND created_at <= $3
		GROUP BY action
		ORDER BY count DESC`

	rows, err := r.db.QueryContext(ctx, query, orgID, startTime, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to get action summary: %w", err)
	}
	defer rows.Close()

	summary := make(map[string]int)
	for rows.Next() {
		var action string
		var count int
		err := rows.Scan(&action, &count)
		if err != nil {
			return nil, fmt.Errorf("failed to scan action summary row: %w", err)
		}
		summary[action] = count
	}

	return summary, nil
}

// GetUserActivity retrieves user activity within a time range
func (r *AuditLogRepository) GetUserActivity(ctx context.Context, orgID string, startTime, endTime time.Time) ([]map[string]interface{}, error) {
	query := `
		SELECT u.name, u.email, COUNT(*) as action_count, 
		       MAX(al.created_at) as last_activity
		FROM audit_logs al
		JOIN users u ON al.user_id = u.id
		WHERE al.organization_id = $1 AND al.created_at >= $2 AND al.created_at <= $3
		GROUP BY u.id, u.name, u.email
		ORDER BY action_count DESC`

	rows, err := r.db.QueryContext(ctx, query, orgID, startTime, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to get user activity: %w", err)
	}
	defer rows.Close()

	var activities []map[string]interface{}
	for rows.Next() {
		var name, email string
		var actionCount int
		var lastActivity time.Time

		err := rows.Scan(&name, &email, &actionCount, &lastActivity)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user activity row: %w", err)
		}

		activities = append(activities, map[string]interface{}{
			"name":          name,
			"email":         email,
			"action_count":  actionCount,
			"last_activity": lastActivity,
		})
	}

	return activities, nil
}