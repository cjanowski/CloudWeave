package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"

	"github.com/google/uuid"
)

// RBACService handles role-based access control operations
type RBACService struct {
	roleRepo         repositories.RoleRepositoryInterface
	userRoleRepo     repositories.UserRoleRepositoryInterface
	resourcePermRepo repositories.ResourcePermissionRepositoryInterface
	apiKeyRepo       repositories.APIKeyRepositoryInterface
	sessionRepo      repositories.SessionRepositoryInterface
	auditRepo        repositories.AuditLogRepositoryInterface
	txManager        repositories.TransactionManager
}

// NewRBACService creates a new RBAC service
func NewRBACService(
	roleRepo repositories.RoleRepositoryInterface,
	userRoleRepo repositories.UserRoleRepositoryInterface,
	resourcePermRepo repositories.ResourcePermissionRepositoryInterface,
	apiKeyRepo repositories.APIKeyRepositoryInterface,
	sessionRepo repositories.SessionRepositoryInterface,
	auditRepo repositories.AuditLogRepositoryInterface,
	txManager repositories.TransactionManager,
) *RBACService {
	return &RBACService{
		roleRepo:         roleRepo,
		userRoleRepo:     userRoleRepo,
		resourcePermRepo: resourcePermRepo,
		apiKeyRepo:       apiKeyRepo,
		sessionRepo:      sessionRepo,
		auditRepo:        auditRepo,
		txManager:        txManager,
	}
}

// Role Management

// CreateRole creates a new role
func (s *RBACService) CreateRole(ctx context.Context, role *models.Role, creatorID string) error {
	// Validate role
	if err := s.validateRole(role); err != nil {
		return fmt.Errorf("invalid role: %w", err)
	}

	// Set timestamps and ID
	now := time.Now()
	role.ID = uuid.New().String()
	role.CreatedAt = now
	role.UpdatedAt = now

	// Create role
	if err := s.roleRepo.Create(ctx, role); err != nil {
		return fmt.Errorf("failed to create role: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, role.OrganizationID, creatorID, "role_created",
		fmt.Sprintf("Created role: %s", role.Name), role.ID)

	return nil
}

// GetRole retrieves a role by ID
func (s *RBACService) GetRole(ctx context.Context, organizationID, roleID string) (*models.Role, error) {
	role, err := s.roleRepo.GetByID(ctx, organizationID, roleID)
	if err != nil {
		return nil, fmt.Errorf("failed to get role: %w", err)
	}
	return role, nil
}

// ListRoles retrieves roles with pagination
func (s *RBACService) ListRoles(ctx context.Context, organizationID string, limit, offset int) ([]*models.Role, int, error) {
	roles, total, err := s.roleRepo.List(ctx, organizationID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list roles: %w", err)
	}
	return roles, total, nil
}

// UpdateRole updates an existing role
func (s *RBACService) UpdateRole(ctx context.Context, role *models.Role, updaterID string) error {
	// Validate role
	if err := s.validateRole(role); err != nil {
		return fmt.Errorf("invalid role: %w", err)
	}

	// Update timestamp
	role.UpdatedAt = time.Now()

	// Update role
	if err := s.roleRepo.Update(ctx, role); err != nil {
		return fmt.Errorf("failed to update role: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, role.OrganizationID, updaterID, "role_updated",
		fmt.Sprintf("Updated role: %s", role.Name), role.ID)

	return nil
}

// DeleteRole deletes a role
func (s *RBACService) DeleteRole(ctx context.Context, organizationID, roleID, deleterID string) error {
	// Get role for audit logging
	role, err := s.roleRepo.GetByID(ctx, organizationID, roleID)
	if err != nil {
		return fmt.Errorf("failed to get role: %w", err)
	}

	// Delete role
	if err := s.roleRepo.Delete(ctx, organizationID, roleID); err != nil {
		return fmt.Errorf("failed to delete role: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, organizationID, deleterID, "role_deleted",
		fmt.Sprintf("Deleted role: %s", role.Name), roleID)

	return nil
}

// User Role Management

// AssignRole assigns a role to a user
func (s *RBACService) AssignRole(ctx context.Context, userID, roleID, organizationID, assignerID string, expiresAt *time.Time) error {
	// Verify role exists
	_, err := s.roleRepo.GetByID(ctx, organizationID, roleID)
	if err != nil {
		return fmt.Errorf("role not found: %w", err)
	}

	// Create user role assignment
	userRole := &models.UserRole{
		ID:             uuid.New().String(),
		UserID:         userID,
		RoleID:         roleID,
		OrganizationID: organizationID,
		AssignedBy:     assignerID,
		AssignedAt:     time.Now(),
		ExpiresAt:      expiresAt,
		IsActive:       true,
	}

	// Assign role
	if err := s.userRoleRepo.AssignRole(ctx, userRole); err != nil {
		return fmt.Errorf("failed to assign role: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, organizationID, assignerID, "role_assigned",
		fmt.Sprintf("Assigned role %s to user %s", roleID, userID), userRole.ID)

	return nil
}

// RemoveRole removes a role from a user
func (s *RBACService) RemoveRole(ctx context.Context, userID, roleID, organizationID, removerID string) error {
	// Remove role
	if err := s.userRoleRepo.RemoveRole(ctx, userID, roleID, organizationID); err != nil {
		return fmt.Errorf("failed to remove role: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, organizationID, removerID, "role_removed",
		fmt.Sprintf("Removed role %s from user %s", roleID, userID), "")

	return nil
}

// GetUserRoles retrieves all roles for a user
func (s *RBACService) GetUserRoles(ctx context.Context, userID, organizationID string) ([]*models.UserRole, error) {
	userRoles, err := s.userRoleRepo.GetUserRoles(ctx, userID, organizationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user roles: %w", err)
	}
	return userRoles, nil
}

// GetUserPermissions retrieves effective permissions for a user
func (s *RBACService) GetUserPermissions(ctx context.Context, userID, organizationID string) (*models.UserPermissions, error) {
	permissions, err := s.userRoleRepo.GetUserPermissions(ctx, userID, organizationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user permissions: %w", err)
	}
	return permissions, nil
}

// Permission Checking

// CheckPermission checks if a user has a specific permission
func (s *RBACService) CheckPermission(ctx context.Context, check *models.PermissionCheck) (*models.PermissionResult, error) {
	// Get user permissions
	permissions, err := s.userRoleRepo.GetUserPermissions(ctx, check.UserID, check.OrganizationID)
	if err != nil {
		return &models.PermissionResult{
			Allowed: false,
			Reason:  "Failed to retrieve user permissions",
		}, nil
	}

	// Check if user is admin (has full access)
	if permissions.IsAdmin {
		return &models.PermissionResult{
			Allowed:   true,
			Reason:    "User has admin privileges",
			GrantedBy: "admin_role",
		}, nil
	}

	// Check direct permission
	for _, perm := range permissions.Permissions {
		if perm == check.Permission {
			return &models.PermissionResult{
				Allowed:   true,
				Reason:    "Permission granted via role",
				GrantedBy: "role_permission",
			}, nil
		}
	}

	// Check resource-specific permissions if applicable
	if check.ResourceType != "" && check.ResourceID != "" {
		hasResourcePerm, err := s.resourcePermRepo.HasPermission(ctx,
			check.UserID, check.ResourceType, check.ResourceID, check.Permission, check.OrganizationID)
		if err == nil && hasResourcePerm {
			return &models.PermissionResult{
				Allowed:   true,
				Reason:    "Permission granted via resource permission",
				GrantedBy: "resource_permission",
			}, nil
		}
	}

	return &models.PermissionResult{
		Allowed: false,
		Reason:  "Permission denied",
	}, nil
}

// HasPermission is a convenience method that returns a boolean
func (s *RBACService) HasPermission(ctx context.Context, userID, organizationID, permission string) bool {
	check := &models.PermissionCheck{
		UserID:         userID,
		OrganizationID: organizationID,
		Permission:     permission,
	}

	result, err := s.CheckPermission(ctx, check)
	if err != nil {
		return false
	}

	return result.Allowed
}

// API Key Management

// CreateAPIKey creates a new API key
func (s *RBACService) CreateAPIKey(ctx context.Context, userID, organizationID, name, description string, permissions []string, expiresAt *time.Time) (*models.APIKey, string, error) {
	// Generate API key
	keyBytes := make([]byte, 32)
	if _, err := rand.Read(keyBytes); err != nil {
		return nil, "", fmt.Errorf("failed to generate API key: %w", err)
	}

	rawKey := hex.EncodeToString(keyBytes)
	keyHash := s.hashAPIKey(rawKey)
	keyPrefix := rawKey[:8] // First 8 characters for identification

	// Create API key record
	apiKey := &models.APIKey{
		ID:             uuid.New().String(),
		UserID:         userID,
		OrganizationID: organizationID,
		Name:           name,
		Description:    description,
		KeyHash:        keyHash,
		KeyPrefix:      keyPrefix,
		Permissions:    permissions,
		Scopes:         []string{}, // TODO: Implement scopes
		IsActive:       true,
		ExpiresAt:      expiresAt,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		Metadata:       make(map[string]interface{}),
	}

	// Save API key
	if err := s.apiKeyRepo.Create(ctx, apiKey); err != nil {
		return nil, "", fmt.Errorf("failed to create API key: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, organizationID, userID, "api_key_created",
		fmt.Sprintf("Created API key: %s", name), apiKey.ID)

	return apiKey, rawKey, nil
}

// ValidateAPIKey validates an API key and returns the associated user
func (s *RBACService) ValidateAPIKey(ctx context.Context, rawKey string) (*models.APIKey, error) {
	keyHash := s.hashAPIKey(rawKey)

	apiKey, err := s.apiKeyRepo.GetByKeyHash(ctx, keyHash)
	if err != nil {
		return nil, fmt.Errorf("invalid API key")
	}

	// Check if key is active
	if !apiKey.IsActive {
		return nil, fmt.Errorf("API key is inactive")
	}

	// Check if key is expired
	if apiKey.ExpiresAt != nil && time.Now().After(*apiKey.ExpiresAt) {
		return nil, fmt.Errorf("API key is expired")
	}

	// Update last used timestamp
	go func() {
		s.apiKeyRepo.UpdateLastUsed(context.Background(), apiKey.ID)
	}()

	return apiKey, nil
}

// Session Management

// CreateSession creates a new user session
func (s *RBACService) CreateSession(ctx context.Context, userID, organizationID, ipAddress, userAgent string, duration time.Duration) (*models.Session, string, error) {
	// Generate session token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return nil, "", fmt.Errorf("failed to generate session token: %w", err)
	}

	rawToken := hex.EncodeToString(tokenBytes)
	tokenHash := s.hashToken(rawToken)

	// Create session
	session := &models.Session{
		ID:             uuid.New().String(),
		UserID:         userID,
		OrganizationID: organizationID,
		TokenHash:      tokenHash,
		IPAddress:      ipAddress,
		UserAgent:      userAgent,
		IsActive:       true,
		LastActivityAt: time.Now(),
		ExpiresAt:      time.Now().Add(duration),
		CreatedAt:      time.Now(),
		Metadata:       make(map[string]interface{}),
	}

	// Save session
	if err := s.sessionRepo.Create(ctx, session); err != nil {
		return nil, "", fmt.Errorf("failed to create session: %w", err)
	}

	return session, rawToken, nil
}

// ValidateSession validates a session token
func (s *RBACService) ValidateSession(ctx context.Context, rawToken string) (*models.Session, error) {
	tokenHash := s.hashToken(rawToken)

	session, err := s.sessionRepo.GetByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil, fmt.Errorf("invalid session token")
	}

	// Check if session is active
	if !session.IsActive {
		return nil, fmt.Errorf("session is inactive")
	}

	// Check if session is expired
	if time.Now().After(session.ExpiresAt) {
		return nil, fmt.Errorf("session is expired")
	}

	// Update last activity
	go func() {
		s.sessionRepo.UpdateActivity(context.Background(), session.ID)
	}()

	return session, nil
}

// Helper methods

func (s *RBACService) validateRole(role *models.Role) error {
	if role.Name == "" {
		return fmt.Errorf("role name is required")
	}
	if role.OrganizationID == "" && !role.IsSystem {
		return fmt.Errorf("organization ID is required for non-system roles")
	}
	return nil
}

func (s *RBACService) hashAPIKey(key string) string {
	hash := sha256.Sum256([]byte(key))
	return hex.EncodeToString(hash[:])
}

func (s *RBACService) hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

func (s *RBACService) logAuditEvent(ctx context.Context, orgID, userID, action, details, resourceID string) {
	resourceType := "rbac"
	detailsMap := map[string]interface{}{
		"message": details,
	}

	auditLog := &models.AuditLog{
		OrganizationID: orgID,
		UserID:         &userID,
		Action:         action,
		ResourceType:   &resourceType,
		ResourceID:     &resourceID,
		Details:        detailsMap,
		IPAddress:      nil, // TODO: Extract from context
		UserAgent:      nil, // TODO: Extract from context
		CreatedAt:      time.Now(),
	}

	// Log asynchronously to avoid blocking the main operation
	go func() {
		if err := s.auditRepo.Create(context.Background(), auditLog); err != nil {
			// Log error but don't fail the main operation
			fmt.Printf("Failed to create audit log: %v\n", err)
		}
	}()
}

// InitializeSystemRoles creates default system roles if they don't exist
func (s *RBACService) InitializeSystemRoles(ctx context.Context) error {
	systemRoles := []models.Role{
		{
			ID:          uuid.New().String(),
			Name:        models.RoleSystemAdmin,
			Description: "Full system administrator access",
			IsSystem:    true,
			Permissions: []string{models.PermissionAdminFull},
			Metadata:    make(map[string]interface{}),
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          uuid.New().String(),
			Name:        models.RoleOrganizationAdmin,
			Description: "Organization administrator access",
			IsSystem:    true,
			Permissions: []string{
				models.PermissionOrgManage,
				models.PermissionUserManage,
				models.PermissionInfrastructureManage,
				models.PermissionDeploymentManage,
				models.PermissionSecurityManage,
				models.PermissionComplianceManage,
				models.PermissionCostManage,
				models.PermissionMonitoringManage,
			},
			Metadata:  make(map[string]interface{}),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          uuid.New().String(),
			Name:        models.RoleViewer,
			Description: "Read-only access to all resources",
			IsSystem:    true,
			Permissions: []string{
				models.PermissionInfrastructureView,
				models.PermissionDeploymentView,
				models.PermissionSecurityView,
				models.PermissionComplianceView,
				models.PermissionCostView,
				models.PermissionMonitoringView,
			},
			Metadata:  make(map[string]interface{}),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}

	for _, role := range systemRoles {
		// Check if role already exists
		existing, err := s.roleRepo.GetByName(ctx, "", role.Name)
		if err == nil && existing != nil {
			continue // Role already exists
		}

		// Create the system role
		if err := s.roleRepo.Create(ctx, &role); err != nil {
			return fmt.Errorf("failed to create system role %s: %w", role.Name, err)
		}
	}

	return nil
}
