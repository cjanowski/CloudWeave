package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"cloudweave/internal/models"
)

type MetricRepository struct {
	db *sql.DB
}

func NewMetricRepository(db *sql.DB) *MetricRepository {
	return &MetricRepository{db: db}
}

// Create creates a new metric in the database
func (r *MetricRepository) Create(ctx context.Context, metric *models.Metric) error {
	query := `
		INSERT INTO metrics (id, resource_id, resource_type, metric_name, value, unit, tags, timestamp)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING created_at`

	err := r.db.QueryRowContext(ctx, query,
		metric.ID,
		metric.ResourceID,
		metric.ResourceType,
		metric.MetricName,
		metric.Value,
		metric.Unit,
		metric.Tags,
		metric.Timestamp,
	).Scan(&metric.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create metric: %w", err)
	}

	return nil
}

// CreateBatch creates multiple metrics in a single transaction for better performance
func (r *MetricRepository) CreateBatch(ctx context.Context, metrics []*models.Metric) error {
	if len(metrics) == 0 {
		return nil
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO metrics (id, resource_id, resource_type, metric_name, value, unit, tags, timestamp)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	for _, metric := range metrics {
		_, err := stmt.ExecContext(ctx,
			metric.ID,
			metric.ResourceID,
			metric.ResourceType,
			metric.MetricName,
			metric.Value,
			metric.Unit,
			metric.Tags,
			metric.Timestamp,
		)
		if err != nil {
			return fmt.Errorf("failed to insert metric: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetByID retrieves a metric by its ID
func (r *MetricRepository) GetByID(ctx context.Context, id string) (*models.Metric, error) {
	metric := &models.Metric{}
	query := `
		SELECT id, resource_id, resource_type, metric_name, value, unit, tags, timestamp, created_at
		FROM metrics 
		WHERE id = $1`

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&metric.ID,
		&metric.ResourceID,
		&metric.ResourceType,
		&metric.MetricName,
		&metric.Value,
		&metric.Unit,
		&metric.Tags,
		&metric.Timestamp,
		&metric.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("metric with id %s not found", id)
		}
		return nil, fmt.Errorf("failed to get metric by id: %w", err)
	}

	return metric, nil
}

// Query retrieves metrics based on query parameters
func (r *MetricRepository) Query(ctx context.Context, query models.MetricQuery) ([]*models.Metric, error) {
	var whereClause strings.Builder
	var args []interface{}
	argIndex := 1

	whereClause.WriteString("WHERE timestamp >= $")
	whereClause.WriteString(fmt.Sprintf("%d", argIndex))
	whereClause.WriteString(" AND timestamp <= $")
	whereClause.WriteString(fmt.Sprintf("%d", argIndex+1))
	args = append(args, query.StartTime, query.EndTime)
	argIndex += 2

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

	if query.MetricName != nil {
		whereClause.WriteString(" AND metric_name = $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex))
		args = append(args, *query.MetricName)
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
		SELECT id, resource_id, resource_type, metric_name, value, unit, tags, timestamp, created_at
		FROM metrics 
		%s
		ORDER BY timestamp DESC
		LIMIT $%d OFFSET $%d`,
		whereClause.String(),
		argIndex,
		argIndex+1,
	)

	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, sqlQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query metrics: %w", err)
	}
	defer rows.Close()

	var metrics []*models.Metric
	for rows.Next() {
		metric := &models.Metric{}
		err := rows.Scan(
			&metric.ID,
			&metric.ResourceID,
			&metric.ResourceType,
			&metric.MetricName,
			&metric.Value,
			&metric.Unit,
			&metric.Tags,
			&metric.Timestamp,
			&metric.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan metric row: %w", err)
		}
		metrics = append(metrics, metric)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating metric rows: %w", err)
	}

	return metrics, nil
}

// Delete deletes a metric by its ID
func (r *MetricRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM metrics WHERE id = $1`
	
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete metric: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("metric with id %s not found", id)
	}

	return nil
}

// DeleteOlderThan deletes metrics older than the specified cutoff time
func (r *MetricRepository) DeleteOlderThan(ctx context.Context, cutoffTime string) error {
	cutoff, err := time.Parse(time.RFC3339, cutoffTime)
	if err != nil {
		return fmt.Errorf("invalid cutoff time format: %w", err)
	}

	query := `DELETE FROM metrics WHERE timestamp < $1`
	
	result, err := r.db.ExecContext(ctx, query, cutoff)
	if err != nil {
		return fmt.Errorf("failed to delete old metrics: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	fmt.Printf("Deleted %d old metrics\n", rowsAffected)
	return nil
}

// GetLatestByResource retrieves the latest metric for a specific resource and metric name
func (r *MetricRepository) GetLatestByResource(ctx context.Context, resourceID, metricName string) (*models.Metric, error) {
	metric := &models.Metric{}
	query := `
		SELECT id, resource_id, resource_type, metric_name, value, unit, tags, timestamp, created_at
		FROM metrics 
		WHERE resource_id = $1 AND metric_name = $2
		ORDER BY timestamp DESC
		LIMIT 1`

	err := r.db.QueryRowContext(ctx, query, resourceID, metricName).Scan(
		&metric.ID,
		&metric.ResourceID,
		&metric.ResourceType,
		&metric.MetricName,
		&metric.Value,
		&metric.Unit,
		&metric.Tags,
		&metric.Timestamp,
		&metric.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no metrics found for resource %s and metric %s", resourceID, metricName)
		}
		return nil, fmt.Errorf("failed to get latest metric: %w", err)
	}

	return metric, nil
}

// GetAggregatedMetrics retrieves aggregated metrics (avg, min, max) for a time range
func (r *MetricRepository) GetAggregatedMetrics(ctx context.Context, resourceID, metricName string, startTime, endTime time.Time, interval string) ([]map[string]interface{}, error) {
	// Validate interval
	validIntervals := map[string]bool{
		"1m": true, "5m": true, "15m": true, "30m": true,
		"1h": true, "6h": true, "12h": true, "1d": true,
	}
	if !validIntervals[interval] {
		interval = "1h"
	}

	query := fmt.Sprintf(`
		SELECT 
			date_trunc('%s', timestamp) as time_bucket,
			AVG(value) as avg_value,
			MIN(value) as min_value,
			MAX(value) as max_value,
			COUNT(*) as count
		FROM metrics 
		WHERE resource_id = $1 AND metric_name = $2 
		AND timestamp >= $3 AND timestamp <= $4
		GROUP BY time_bucket
		ORDER BY time_bucket`, interval)

	rows, err := r.db.QueryContext(ctx, query, resourceID, metricName, startTime, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to get aggregated metrics: %w", err)
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var timeBucket time.Time
		var avgValue, minValue, maxValue float64
		var count int

		err := rows.Scan(&timeBucket, &avgValue, &minValue, &maxValue, &count)
		if err != nil {
			return nil, fmt.Errorf("failed to scan aggregated metric row: %w", err)
		}

		results = append(results, map[string]interface{}{
			"time":      timeBucket,
			"avg_value": avgValue,
			"min_value": minValue,
			"max_value": maxValue,
			"count":     count,
		})
	}

	return results, nil
}