package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"cloudweave/internal/models"

	"github.com/lib/pq"
)

// RoleRepository handles role data operations
type RoleRepository struct {
	db *sql.DB
}

// NewRoleRepository creates a new role repository
func NewRoleRepository(db *sql.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

// Create creates a new role
func (r *RoleRepository) Create(ctx context.Context, role *models.Role) error {
	metadataJSON, err := json.Marshal(role.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	query := `
		INSERT INTO roles (id, organization_id, name, description, is_system, permissions, metadata, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err = r.db.ExecContext(ctx, query,
		role.ID, role.OrganizationID, role.Name, role.Description, role.IsSystem,
		pq.Array(role.Permissions), metadataJSON, role.CreatedAt, role.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create role: %w", err)
	}

	return nil
}

// GetByID retrieves a role by ID
func (r *RoleRepository) GetByID(ctx context.Context, organizationID, roleID string) (*models.Role, error) {
	query := `
		SELECT id, organization_id, name, description, is_system, permissions, metadata, created_at, updated_at
		FROM roles
		WHERE id = $1 AND (organization_id = $2 OR is_system = true)`

	var role models.Role
	var metadataJSON []byte

	err := r.db.QueryRowContext(ctx, query, roleID, organizationID).Scan(
		&role.ID, &role.OrganizationID, &role.Name, &role.Description, &role.IsSystem,
		pq.Array(&role.Permissions), &metadataJSON, &role.CreatedAt, &role.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("role not found")
		}
		return nil, fmt.Errorf("failed to get role: %w", err)
	}

	if err := json.Unmarshal(metadataJSON, &role.Metadata); err != nil {
		return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
	}

	return &role, nil
}

// GetByName retrieves a role by name
func (r *RoleRepository) GetByName(ctx context.Context, organizationID, name string) (*models.Role, error) {
	query := `
		SELECT id, organization_id, name, description, is_system, permissions, metadata, created_at, updated_at
		FROM roles
		WHERE name = $1 AND (organization_id = $2 OR is_system = true)`

	var role models.Role
	var metadataJSON []byte

	err := r.db.QueryRowContext(ctx, query, name, organizationID).Scan(
		&role.ID, &role.OrganizationID, &role.Name, &role.Description, &role.IsSystem,
		pq.Array(&role.Permissions), &metadataJSON, &role.CreatedAt, &role.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("role not found")
		}
		return nil, fmt.Errorf("failed to get role: %w", err)
	}

	if err := json.Unmarshal(metadataJSON, &role.Metadata); err != nil {
		return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
	}

	return &role, nil
}

// List retrieves roles with pagination
func (r *RoleRepository) List(ctx context.Context, organizationID string, limit, offset int) ([]*models.Role, int, error) {
	// Get total count
	countQuery := `SELECT COUNT(*) FROM roles WHERE organization_id = $1 OR is_system = true`
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, organizationID).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get total count: %w", err)
	}

	// Get roles
	query := `
		SELECT id, organization_id, name, description, is_system, permissions, metadata, created_at, updated_at
		FROM roles
		WHERE organization_id = $1 OR is_system = true
		ORDER BY is_system DESC, name ASC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.QueryContext(ctx, query, organizationID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query roles: %w", err)
	}
	defer rows.Close()

	var roles []*models.Role
	for rows.Next() {
		var role models.Role
		var metadataJSON []byte

		err := rows.Scan(
			&role.ID, &role.OrganizationID, &role.Name, &role.Description, &role.IsSystem,
			pq.Array(&role.Permissions), &metadataJSON, &role.CreatedAt, &role.UpdatedAt)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan role: %w", err)
		}

		if err := json.Unmarshal(metadataJSON, &role.Metadata); err != nil {
			return nil, 0, fmt.Errorf("failed to unmarshal metadata: %w", err)
		}

		roles = append(roles, &role)
	}

	return roles, total, nil
}

// Update updates a role
func (r *RoleRepository) Update(ctx context.Context, role *models.Role) error {
	metadataJSON, err := json.Marshal(role.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	query := `
		UPDATE roles
		SET name = $1, description = $2, permissions = $3, metadata = $4, updated_at = $5
		WHERE id = $6 AND organization_id = $7`

	result, err := r.db.ExecContext(ctx, query,
		role.Name, role.Description, pq.Array(role.Permissions), metadataJSON, role.UpdatedAt,
		role.ID, role.OrganizationID)

	if err != nil {
		return fmt.Errorf("failed to update role: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("role not found or not authorized")
	}

	return nil
}

// Delete deletes a role
func (r *RoleRepository) Delete(ctx context.Context, organizationID, roleID string) error {
	query := `DELETE FROM roles WHERE id = $1 AND organization_id = $2 AND is_system = false`

	result, err := r.db.ExecContext(ctx, query, roleID, organizationID)
	if err != nil {
		return fmt.Errorf("failed to delete role: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("role not found or cannot delete system role")
	}

	return nil
}

// ListSystemRoles retrieves all system roles
func (r *RoleRepository) ListSystemRoles(ctx context.Context) ([]*models.Role, error) {
	query := `
		SELECT id, organization_id, name, description, is_system, permissions, metadata, created_at, updated_at
		FROM roles
		WHERE is_system = true
		ORDER BY name ASC`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query system roles: %w", err)
	}
	defer rows.Close()

	var roles []*models.Role
	for rows.Next() {
		var role models.Role
		var metadataJSON []byte

		err := rows.Scan(
			&role.ID, &role.OrganizationID, &role.Name, &role.Description, &role.IsSystem,
			pq.Array(&role.Permissions), &metadataJSON, &role.CreatedAt, &role.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan role: %w", err)
		}

		if err := json.Unmarshal(metadataJSON, &role.Metadata); err != nil {
			return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
		}

		roles = append(roles, &role)
	}

	return roles, nil
}

// UserRoleRepository handles user role assignment operations
type UserRoleRepository struct {
	db *sql.DB
}

// NewUserRoleRepository creates a new user role repository
func NewUserRoleRepository(db *sql.DB) *UserRoleRepository {
	return &UserRoleRepository{db: db}
}

// AssignRole assigns a role to a user
func (ur *UserRoleRepository) AssignRole(ctx context.Context, userRole *models.UserRole) error {
	query := `
		INSERT INTO user_roles (id, user_id, role_id, organization_id, assigned_by, assigned_at, expires_at, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (user_id, role_id, organization_id) 
		DO UPDATE SET is_active = $8, assigned_by = $5, assigned_at = $6, expires_at = $7`

	_, err := ur.db.ExecContext(ctx, query,
		userRole.ID, userRole.UserID, userRole.RoleID, userRole.OrganizationID,
		userRole.AssignedBy, userRole.AssignedAt, userRole.ExpiresAt, userRole.IsActive)

	if err != nil {
		return fmt.Errorf("failed to assign role: %w", err)
	}

	return nil
}

// RemoveRole removes a role from a user
func (ur *UserRoleRepository) RemoveRole(ctx context.Context, userID, roleID, organizationID string) error {
	query := `UPDATE user_roles SET is_active = false WHERE user_id = $1 AND role_id = $2 AND organization_id = $3`

	result, err := ur.db.ExecContext(ctx, query, userID, roleID, organizationID)
	if err != nil {
		return fmt.Errorf("failed to remove role: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user role assignment not found")
	}

	return nil
}

// GetUserRoles retrieves all roles for a user
func (ur *UserRoleRepository) GetUserRoles(ctx context.Context, userID, organizationID string) ([]*models.UserRole, error) {
	query := `
		SELECT ur.id, ur.user_id, ur.role_id, ur.organization_id, ur.assigned_by, ur.assigned_at, ur.expires_at, ur.is_active
		FROM user_roles ur
		WHERE ur.user_id = $1 AND ur.organization_id = $2 AND ur.is_active = true
		AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`

	rows, err := ur.db.QueryContext(ctx, query, userID, organizationID)
	if err != nil {
		return nil, fmt.Errorf("failed to query user roles: %w", err)
	}
	defer rows.Close()

	var userRoles []*models.UserRole
	for rows.Next() {
		var userRole models.UserRole

		err := rows.Scan(
			&userRole.ID, &userRole.UserID, &userRole.RoleID, &userRole.OrganizationID,
			&userRole.AssignedBy, &userRole.AssignedAt, &userRole.ExpiresAt, &userRole.IsActive)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user role: %w", err)
		}

		userRoles = append(userRoles, &userRole)
	}

	return userRoles, nil
}

// GetRoleUsers retrieves all users with a specific role
func (ur *UserRoleRepository) GetRoleUsers(ctx context.Context, roleID, organizationID string) ([]*models.UserRole, error) {
	query := `
		SELECT ur.id, ur.user_id, ur.role_id, ur.organization_id, ur.assigned_by, ur.assigned_at, ur.expires_at, ur.is_active
		FROM user_roles ur
		WHERE ur.role_id = $1 AND ur.organization_id = $2 AND ur.is_active = true
		AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`

	rows, err := ur.db.QueryContext(ctx, query, roleID, organizationID)
	if err != nil {
		return nil, fmt.Errorf("failed to query role users: %w", err)
	}
	defer rows.Close()

	var userRoles []*models.UserRole
	for rows.Next() {
		var userRole models.UserRole

		err := rows.Scan(
			&userRole.ID, &userRole.UserID, &userRole.RoleID, &userRole.OrganizationID,
			&userRole.AssignedBy, &userRole.AssignedAt, &userRole.ExpiresAt, &userRole.IsActive)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user role: %w", err)
		}

		userRoles = append(userRoles, &userRole)
	}

	return userRoles, nil
}

// IsUserInRole checks if a user has a specific role
func (ur *UserRoleRepository) IsUserInRole(ctx context.Context, userID, roleID, organizationID string) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM user_roles 
			WHERE user_id = $1 AND role_id = $2 AND organization_id = $3 AND is_active = true
			AND (expires_at IS NULL OR expires_at > NOW())
		)`

	var exists bool
	err := ur.db.QueryRowContext(ctx, query, userID, roleID, organizationID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check user role: %w", err)
	}

	return exists, nil
}

// GetUserPermissions retrieves effective permissions for a user
func (ur *UserRoleRepository) GetUserPermissions(ctx context.Context, userID, organizationID string) (*models.UserPermissions, error) {
	// Get user roles with role details
	query := `
		SELECT r.id, r.name, r.permissions, r.is_system
		FROM user_roles ur
		JOIN roles r ON ur.role_id = r.id
		WHERE ur.user_id = $1 AND ur.organization_id = $2 AND ur.is_active = true
		AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`

	rows, err := ur.db.QueryContext(ctx, query, userID, organizationID)
	if err != nil {
		return nil, fmt.Errorf("failed to query user permissions: %w", err)
	}
	defer rows.Close()

	var roles []models.Role
	permissionSet := make(map[string]bool)
	isAdmin := false

	for rows.Next() {
		var role models.Role
		var permissions []string

		err := rows.Scan(&role.ID, &role.Name, pq.Array(&permissions), &role.IsSystem)
		if err != nil {
			return nil, fmt.Errorf("failed to scan role: %w", err)
		}

		role.Permissions = permissions
		roles = append(roles, role)

		// Collect unique permissions
		for _, perm := range permissions {
			permissionSet[perm] = true
			if perm == models.PermissionAdminFull {
				isAdmin = true
			}
		}
	}

	// Convert permission set to slice
	var permissions []string
	for perm := range permissionSet {
		permissions = append(permissions, perm)
	}

	return &models.UserPermissions{
		UserID:         userID,
		OrganizationID: organizationID,
		Roles:          roles,
		Permissions:    permissions,
		ResourcePerms:  make(map[string]map[string][]string), // TODO: Implement resource permissions
		IsAdmin:        isAdmin,
		LastUpdated:    time.Now(),
	}, nil
}