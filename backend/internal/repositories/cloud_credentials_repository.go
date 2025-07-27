package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"cloudweave/internal/models"

	"github.com/jmoiron/sqlx"
)

type CloudCredentialsRepository struct {
	db *sqlx.DB
}

func NewCloudCredentialsRepository(db *sqlx.DB) *CloudCredentialsRepository {
	return &CloudCredentialsRepository{db: db}
}

// Create creates new cloud credentials
func (r *CloudCredentialsRepository) Create(ctx context.Context, cred *models.CloudCredentials) error {
	credentialsJSON, err := json.Marshal(cred.Credentials)
	if err != nil {
		return fmt.Errorf("failed to marshal credentials: %w", err)
	}

	query := `
		INSERT INTO cloud_credentials (id, organization_id, provider, credential_type, credentials, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	
	_, err = r.db.ExecContext(ctx, query,
		cred.ID,
		cred.OrganizationID,
		cred.Provider,
		cred.CredentialType,
		credentialsJSON,
		cred.IsActive,
	)
	
	if err != nil {
		return fmt.Errorf("failed to create cloud credentials: %w", err)
	}

	return nil
}

// GetByID gets cloud credentials by ID
func (r *CloudCredentialsRepository) GetByID(ctx context.Context, id string) (*models.CloudCredentials, error) {
	var cred models.CloudCredentials
	var credentialsJSON []byte

	query := `
		SELECT id, organization_id, provider, credential_type, credentials, is_active, created_at, updated_at
		FROM cloud_credentials
		WHERE id = $1
	`

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&cred.ID,
		&cred.OrganizationID,
		&cred.Provider,
		&cred.CredentialType,
		&credentialsJSON,
		&cred.IsActive,
		&cred.CreatedAt,
		&cred.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("cloud credentials not found")
		}
		return nil, fmt.Errorf("failed to get cloud credentials: %w", err)
	}

	if err := json.Unmarshal(credentialsJSON, &cred.Credentials); err != nil {
		return nil, fmt.Errorf("failed to unmarshal credentials: %w", err)
	}

	return &cred, nil
}

// GetActiveByProvider gets active credentials for a provider
func (r *CloudCredentialsRepository) GetActiveByProvider(ctx context.Context, organizationID, provider string) (*models.CloudCredentials, error) {
	var cred models.CloudCredentials
	var credentialsJSON []byte

	query := `
		SELECT id, organization_id, provider, credential_type, credentials, is_active, created_at, updated_at
		FROM cloud_credentials
		WHERE organization_id = $1 AND provider = $2 AND is_active = true
		ORDER BY created_at DESC
		LIMIT 1
	`

	err := r.db.QueryRowContext(ctx, query, organizationID, provider).Scan(
		&cred.ID,
		&cred.OrganizationID,
		&cred.Provider,
		&cred.CredentialType,
		&credentialsJSON,
		&cred.IsActive,
		&cred.CreatedAt,
		&cred.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no active credentials found for provider %s", provider)
		}
		return nil, fmt.Errorf("failed to get active credentials: %w", err)
	}

	if err := json.Unmarshal(credentialsJSON, &cred.Credentials); err != nil {
		return nil, fmt.Errorf("failed to unmarshal credentials: %w", err)
	}

	return &cred, nil
}

// ListByOrganization lists all credentials for an organization
func (r *CloudCredentialsRepository) ListByOrganization(ctx context.Context, organizationID string) ([]*models.CloudCredentials, error) {
	query := `
		SELECT id, organization_id, provider, credential_type, credentials, is_active, created_at, updated_at
		FROM cloud_credentials
		WHERE organization_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, organizationID)
	if err != nil {
		return nil, fmt.Errorf("failed to list credentials: %w", err)
	}
	defer rows.Close()

	var credentials []*models.CloudCredentials
	for rows.Next() {
		var cred models.CloudCredentials
		var credentialsJSON []byte

		err := rows.Scan(
			&cred.ID,
			&cred.OrganizationID,
			&cred.Provider,
			&cred.CredentialType,
			&credentialsJSON,
			&cred.IsActive,
			&cred.CreatedAt,
			&cred.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan credential row: %w", err)
		}

		if err := json.Unmarshal(credentialsJSON, &cred.Credentials); err != nil {
			return nil, fmt.Errorf("failed to unmarshal credentials: %w", err)
		}

		// Don't expose sensitive credential data in list view
		cred.Credentials = map[string]interface{}{
			"type": cred.Credentials["type"],
		}

		credentials = append(credentials, &cred)
	}

	return credentials, nil
}

// DeactivateByType deactivates all credentials of a specific type for an organization
func (r *CloudCredentialsRepository) DeactivateByType(ctx context.Context, organizationID, provider, credentialType string) error {
	query := `
		UPDATE cloud_credentials
		SET is_active = false, updated_at = NOW()
		WHERE organization_id = $1 AND provider = $2 AND credential_type = $3 AND is_active = true
	`

	_, err := r.db.ExecContext(ctx, query, organizationID, provider, credentialType)
	if err != nil {
		return fmt.Errorf("failed to deactivate credentials: %w", err)
	}

	return nil
}

// Delete deletes cloud credentials
func (r *CloudCredentialsRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM cloud_credentials WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete credentials: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("credentials not found")
	}

	return nil
}