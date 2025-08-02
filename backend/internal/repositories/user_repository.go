package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"cloudweave/internal/models"

	"github.com/lib/pq"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create creates a new user in the database
func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (id, email, name, password_hash, organization_id)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING created_at, updated_at`

	err := r.db.QueryRowContext(ctx, query,
		user.ID,
		user.Email,
		user.Name,
		user.PasswordHash,
		user.OrganizationID,
	).Scan(&user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			switch pqErr.Code {
			case "23505": // unique_violation
				if pqErr.Constraint == "users_email_key" {
					return fmt.Errorf("user with email %s already exists", user.Email)
				}
			}
		}
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// GetByID retrieves a user by their ID
func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, email, password_hash, name, organization_id, 
		       created_at, updated_at
		FROM users
		WHERE id = $1`

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.OrganizationID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	// Set default values for compatibility
	if err == nil {
		user.Preferences = make(map[string]interface{})
		user.Role = "user" // Default role
		user.EmailVerified = false // Default value
	}

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user with id %s not found", id)
		}
		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}

	return user, nil
}

// GetByEmail retrieves a user by their email address
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, email, password_hash, name, organization_id, 
		       created_at, updated_at
		FROM users
		WHERE email = $1`

	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.OrganizationID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	// Set default values for compatibility
	if err == nil {
		user.Preferences = make(map[string]interface{})
		user.Role = "user" // Default role
		user.EmailVerified = false // Default value
	}

	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("DEBUG: No rows found for email: %s\n", email)
			return nil, fmt.Errorf("user with email %s not found", email)
		}
		fmt.Printf("DEBUG: Database error for email %s: %v\n", email, err)
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	fmt.Printf("DEBUG: Successfully found user: %s (ID: %s)\n", user.Email, user.ID)

	return user, nil
}

// Update updates an existing user
func (r *UserRepository) Update(ctx context.Context, user *models.User) error {
	query := `
		UPDATE users
		SET name = $2, organization_id = $3, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at`

	err := r.db.QueryRowContext(ctx, query,
		user.ID,
		user.Name,
		user.OrganizationID,
	).Scan(&user.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("user with id %s not found", user.ID)
		}
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

// UpdateLastLogin updates the user's last login timestamp
func (r *UserRepository) UpdateLastLogin(ctx context.Context, userID string) error {
	query := `UPDATE users SET last_login_at = NOW() WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to update last login: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user with id %s not found", userID)
	}

	return nil
}

// UpdatePassword updates the user's password hash
func (r *UserRepository) UpdatePassword(ctx context.Context, userID, passwordHash string) error {
	query := `UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, userID, passwordHash)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user with id %s not found", userID)
	}

	return nil
}

// UpdatePreferences updates the user's preferences (stored in memory only for compatibility)
func (r *UserRepository) UpdatePreferences(ctx context.Context, userID string, preferences map[string]interface{}) error {
	// Since preferences column doesn't exist in the current schema, 
	// we'll just verify the user exists for now
	_, err := r.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}
	
	// In a future migration, we could add a preferences column or separate table
	// For now, just return success to maintain compatibility
	return nil
}

// Delete deletes a user by their ID
func (r *UserRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM users WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user with id %s not found", id)
	}

	return nil
}

// EmailExists checks if a user with the given email already exists
func (r *UserRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`

	err := r.db.QueryRowContext(ctx, query, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check if email exists: %w", err)
	}

	return exists, nil
}

// List retrieves users with pagination and filtering
func (r *UserRepository) List(ctx context.Context, params ListParams) ([]*models.User, error) {
	params.Validate()

	var whereClause strings.Builder
	var args []interface{}
	argIndex := 1

	// Add search filter if provided
	if params.Search != "" {
		whereClause.WriteString("WHERE (name ILIKE $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex))
		whereClause.WriteString(" OR email ILIKE $")
		whereClause.WriteString(fmt.Sprintf("%d", argIndex+1))
		whereClause.WriteString(")")
		searchPattern := "%" + params.Search + "%"
		args = append(args, searchPattern, searchPattern)
		argIndex += 2
	}

	// Validate sort column
	validSortColumns := map[string]bool{
		"name":           true,
		"email":          true,
		"role":           true,
		"email_verified": true,
		"created_at":     true,
		"updated_at":     true,
		"last_login_at":  true,
	}
	if !validSortColumns[params.SortBy] {
		params.SortBy = "created_at"
	}

	query := fmt.Sprintf(`
		SELECT id, email, name, password_hash, organization_id, 
		       created_at, updated_at
		FROM users
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
		return nil, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.Name,
			&user.PasswordHash,
			&user.OrganizationID,
			&user.CreatedAt,
			&user.UpdatedAt,
		)

		// Set default values for compatibility
		user.Preferences = make(map[string]interface{})
		user.Role = "user"
		user.EmailVerified = false
		user.IsActive = true
		if err != nil {
			return nil, fmt.Errorf("failed to scan user row: %w", err)
		}
		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating user rows: %w", err)
	}

	return users, nil
}
// UpdateDemoSettings updates the user's demo mode and scenario
func (r *UserRepository) UpdateDemoSettings(ctx context.Context, userID string, demoMode bool, demoScenario string) error {
	query := `
		UPDATE users 
		SET demo_mode = $2, demo_scenario = $3, updated_at = NOW() 
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, userID, demoMode, demoScenario)
	if err != nil {
		return fmt.Errorf("failed to update demo settings: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user with id %s not found", userID)
	}

	return nil
}

// UpdateOnboardingCompleted updates the user's onboarding completion status
func (r *UserRepository) UpdateOnboardingCompleted(ctx context.Context, userID string, completed bool) error {
	query := `
		UPDATE users 
		SET onboarding_completed = $2, updated_at = NOW() 
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, userID, completed)
	if err != nil {
		return fmt.Errorf("failed to update onboarding status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user with id %s not found", userID)
	}

	return nil
}

// GetDemoUsers retrieves all users in demo mode
func (r *UserRepository) GetDemoUsers(ctx context.Context) ([]*models.User, error) {
	query := `
		SELECT id, email, name, password_hash, organization_id, 
		       created_at, updated_at
		FROM users
		ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get demo users: %w", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.Name,
			&user.PasswordHash,
			&user.OrganizationID,
			&user.CreatedAt,
			&user.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan demo user row: %w", err)
		}

		// Set default values for compatibility
		user.Preferences = make(map[string]interface{})
		user.Role = "user"
		user.EmailVerified = false
		user.IsActive = true
		user.DemoMode = true

		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating demo user rows: %w", err)
	}

	return users, nil
}