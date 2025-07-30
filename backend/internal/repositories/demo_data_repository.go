package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"cloudweave/internal/models"

	"github.com/jmoiron/sqlx"
)

type DemoDataRepository struct {
	db *sqlx.DB
}

func NewDemoDataRepository(db *sqlx.DB) *DemoDataRepository {
	return &DemoDataRepository{db: db}
}

// Create creates a new demo data entry
func (r *DemoDataRepository) Create(ctx context.Context, demoData *models.DemoData) error {
	// Marshal the data to JSON
	dataJSON, err := json.Marshal(demoData.Data)
	if err != nil {
		return fmt.Errorf("failed to marshal demo data: %w", err)
	}

	query := `
		INSERT INTO demo_data (id, user_id, scenario, data_type, data, generated_at, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	_, err = r.db.ExecContext(ctx, query,
		demoData.ID,
		demoData.UserID,
		demoData.Scenario,
		demoData.DataType,
		dataJSON,
		demoData.GeneratedAt,
		demoData.ExpiresAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create demo data: %w", err)
	}

	return nil
}

// GetByUserAndType retrieves demo data by user ID and data type
func (r *DemoDataRepository) GetByUserAndType(ctx context.Context, userID, dataType string) (*models.DemoData, error) {
	query := `
		SELECT id, user_id, scenario, data_type, data, generated_at, expires_at
		FROM demo_data
		WHERE user_id = $1 AND data_type = $2
		ORDER BY generated_at DESC
		LIMIT 1
	`

	var demoData models.DemoData
	var dataJSON []byte

	err := r.db.QueryRowContext(ctx, query, userID, dataType).Scan(
		&demoData.ID,
		&demoData.UserID,
		&demoData.Scenario,
		&demoData.DataType,
		&dataJSON,
		&demoData.GeneratedAt,
		&demoData.ExpiresAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("demo data not found for user %s and type %s", userID, dataType)
		}
		return nil, fmt.Errorf("failed to get demo data: %w", err)
	}

	// Unmarshal the JSON data
	if err := json.Unmarshal(dataJSON, &demoData.Data); err != nil {
		return nil, fmt.Errorf("failed to unmarshal demo data: %w", err)
	}

	return &demoData, nil
}

// GetByUser retrieves all demo data for a user
func (r *DemoDataRepository) GetByUser(ctx context.Context, userID string) ([]*models.DemoData, error) {
	query := `
		SELECT id, user_id, scenario, data_type, data, generated_at, expires_at
		FROM demo_data
		WHERE user_id = $1
		ORDER BY data_type, generated_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query demo data: %w", err)
	}
	defer rows.Close()

	var demoDataList []*models.DemoData

	for rows.Next() {
		var demoData models.DemoData
		var dataJSON []byte

		err := rows.Scan(
			&demoData.ID,
			&demoData.UserID,
			&demoData.Scenario,
			&demoData.DataType,
			&dataJSON,
			&demoData.GeneratedAt,
			&demoData.ExpiresAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan demo data row: %w", err)
		}

		// Unmarshal the JSON data
		if err := json.Unmarshal(dataJSON, &demoData.Data); err != nil {
			return nil, fmt.Errorf("failed to unmarshal demo data: %w", err)
		}

		demoDataList = append(demoDataList, &demoData)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating demo data rows: %w", err)
	}

	return demoDataList, nil
}

// DeleteByUser deletes all demo data for a user
func (r *DemoDataRepository) DeleteByUser(ctx context.Context, userID string) error {
	query := `DELETE FROM demo_data WHERE user_id = $1`

	_, err := r.db.ExecContext(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete demo data for user %s: %w", userID, err)
	}

	return nil
}

// DeleteByUserAndType deletes demo data for a user by type
func (r *DemoDataRepository) DeleteByUserAndType(ctx context.Context, userID, dataType string) error {
	query := `DELETE FROM demo_data WHERE user_id = $1 AND data_type = $2`

	_, err := r.db.ExecContext(ctx, query, userID, dataType)
	if err != nil {
		return fmt.Errorf("failed to delete demo data for user %s and type %s: %w", userID, dataType, err)
	}

	return nil
}

// DeleteExpired deletes expired demo data
func (r *DemoDataRepository) DeleteExpired(ctx context.Context) error {
	query := `DELETE FROM demo_data WHERE expires_at IS NOT NULL AND expires_at < NOW()`

	result, err := r.db.ExecContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to delete expired demo data: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	fmt.Printf("Deleted %d expired demo data entries\n", rowsAffected)
	return nil
}

// Update updates demo data
func (r *DemoDataRepository) Update(ctx context.Context, demoData *models.DemoData) error {
	// Marshal the data to JSON
	dataJSON, err := json.Marshal(demoData.Data)
	if err != nil {
		return fmt.Errorf("failed to marshal demo data: %w", err)
	}

	query := `
		UPDATE demo_data
		SET scenario = $2, data_type = $3, data = $4, expires_at = $5
		WHERE id = $1
	`

	_, err = r.db.ExecContext(ctx, query,
		demoData.ID,
		demoData.Scenario,
		demoData.DataType,
		dataJSON,
		demoData.ExpiresAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update demo data: %w", err)
	}

	return nil
}