package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"cloudweave/internal/models"

	"github.com/lib/pq"
)

type OrganizationRepository struct {
	db *sql.DB
}

func NewOrganizationRepository(db *sql.DB) *OrganizationRepository {
	return &OrganizationRepository{db: db}
}

// Create creates a new organization in the database
func (r *OrganizationRepository) Create(ctx context.Context, org *models.Organization) error {
	query := `
		INSERT INTO organizations (id, name, slug, settings)
		VALUES ($1, $2, $3, $4)
		RETURNING created_at, updated_at`

	// Marshal settings to JSON
	settingsJSON, err := json.Marshal(org.Settings)
	if err != nil {
		return fmt.Errorf("failed to marshal settings: %w", err)
	}

	err = r.db.QueryRowContext(ctx, query,
		org.ID,
		org.Name,
		org.Slug,
		settingsJSON,
	).Scan(&org.CreatedAt, &org.UpdatedAt)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			switch pqErr.Code {
			case "23505": // unique_violation
				if pqErr.Constraint == "organizations_slug_key" {
					return fmt.Errorf("organization with slug %s already exists", org.Slug)
				}
			}
		}
		return fmt.Errorf("failed to create organization: %w", err)
	}

	return nil
}

// GetByID retrieves an organization by its ID
func (r *OrganizationRepository) GetByID(ctx context.Context, id string) (*models.Organization, error) {
	org := &models.Organization{}
	var settingsJSON []byte
	query := `
		SELECT id, name, slug, settings, created_at, updated_at
		FROM organizations 
		WHERE id = $1`

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&org.ID,
		&org.Name,
		&org.Slug,
		&settingsJSON,
		&org.CreatedAt,
		&org.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("organization with id %s not found", id)
		}
		return nil, fmt.Errorf("failed to get organization by id: %w", err)
	}

	// Unmarshal settings from JSON
	if err := json.Unmarshal(settingsJSON, &org.Settings); err != nil {
		return nil, fmt.Errorf("failed to unmarshal settings: %w", err)
	}

	return org, nil
}

// GetBySlug retrieves an organization by its slug
func (r *OrganizationRepository) GetBySlug(ctx context.Context, slug string) (*models.Organization, error) {
	org := &models.Organization{}
	query := `
		SELECT id, name, slug, settings, created_at, updated_at
		FROM organizations 
		WHERE slug = $1`

	err := r.db.QueryRowContext(ctx, query, slug).Scan(
		&org.ID,
		&org.Name,
		&org.Slug,
		&org.Settings,
		&org.CreatedAt,
		&org.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("organization with slug %s not found", slug)
		}
		return nil, fmt.Errorf("failed to get organization by slug: %w", err)
	}

	return org, nil
}

// Update updates an existing organization
func (r *OrganizationRepository) Update(ctx context.Context, org *models.Organization) error {
	query := `
		UPDATE organizations 
		SET name = $2, slug = $3, settings = $4, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at`

	err := r.db.QueryRowContext(ctx, query,
		org.ID,
		org.Name,
		org.Slug,
		org.Settings,
	).Scan(&org.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("organization with id %s not found", org.ID)
		}
		if pqErr, ok := err.(*pq.Error); ok {
			switch pqErr.Code {
			case "23505": // unique_violation
				if pqErr.Constraint == "organizations_slug_key" {
					return fmt.Errorf("organization with slug %s already exists", org.Slug)
				}
			}
		}
		return fmt.Errorf("failed to update organization: %w", err)
	}

	return nil
}

// Delete deletes an organization by its ID
func (r *OrganizationRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM organizations WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete organization: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("organization with id %s not found", id)
	}

	return nil
}

// List retrieves organizations with pagination and filtering
func (r *OrganizationRepository) List(ctx context.Context, params ListParams) ([]*models.Organization, error) {
	params.Validate()

	var whereClause strings.Builder
	var args []interface{}
	argIndex := 1

	// Add search filter if provided
	if params.Search != "" {
		whereClause.WriteString("WHERE (name ILIKE $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex))
		whereClause.WriteString(" OR slug ILIKE $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex+1))
		whereClause.WriteString(")")
		searchPattern := "%" + params.Search + "%"
		args = append(args, searchPattern, searchPattern)
		argIndex += 2
	}

	// Validate sort column
	validSortColumns := map[string]bool{
		"name":       true,
		"slug":       true,
		"created_at": true,
		"updated_at": true,
	}
	if !validSortColumns[params.SortBy] {
		params.SortBy = "created_at"
	}

	query := fmt.Sprintf(`
		SELECT id, name, slug, settings, created_at, updated_at
		FROM organizations 
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
		return nil, fmt.Errorf("failed to list organizations: %w", err)
	}
	defer rows.Close()

	var organizations []*models.Organization
	for rows.Next() {
		org := &models.Organization{}
		err := rows.Scan(
			&org.ID,
			&org.Name,
			&org.Slug,
			&org.Settings,
			&org.CreatedAt,
			&org.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan organization row: %w", err)
		}
		organizations = append(organizations, org)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating organization rows: %w", err)
	}

	return organizations, nil
}

// SlugExists checks if an organization with the given slug already exists
func (r *OrganizationRepository) SlugExists(ctx context.Context, slug string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM organizations WHERE slug = $1)`

	err := r.db.QueryRowContext(ctx, query, slug).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check if slug exists: %w", err)
	}

	return exists, nil
}

// GenerateSlug generates a URL-friendly slug from an organization name
func GenerateSlug(name string) string {
	// Convert to lowercase
	slug := strings.ToLower(name)

	// Replace spaces and special characters with hyphens
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "_", "-")

	// Remove any characters that aren't alphanumeric or hyphens
	var result strings.Builder
	for _, char := range slug {
		if (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '-' {
			result.WriteRune(char)
		}
	}

	// Remove multiple consecutive hyphens
	slug = result.String()
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}

	// Trim hyphens from start and end
	slug = strings.Trim(slug, "-")

	return slug
}
