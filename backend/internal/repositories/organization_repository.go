package repositories

import (
	"context"
	"database/sql"
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

	err := r.db.QueryRowContext(ctx, query,
		org.ID,
		org.Name,
		org.Slug,
		org.Settings,
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
	query := `
		SELECT id, name, slug, settings, created_at, updated_at
		FROM organizations 
		WHERE id = $1`

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&org.ID,
		&org.Name,
		&org.Slug,
		&org.Settings,
		&org.CreatedAt,
		&org.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("organization with id %s not found", id)
		}
		return nil, fmt.Errorf("failed to get organization by id: %w", err)
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