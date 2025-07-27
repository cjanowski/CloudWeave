package models

import (
	"time"
)

// Role represents a role in the RBAC system
type Role struct {
	ID             string                 `json:"id" db:"id"`
	OrganizationID string                 `json:"organizationId" db:"organization_id"`
	Name           string                 `json:"name" db:"name"`
	Description    string                 `json:"description" db:"description"`
	IsSystem       bool                   `json:"isSystem" db:"is_system"`
	Permissions    []string               `json:"permissions" db:"permissions"`
	Metadata       map[string]interface{} `json:"metadata" db:"metadata"`
	CreatedAt      time.Time              `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time              `json:"updatedAt" db:"updated_at"`
}

// Permission represents a specific permission in the system
type Permission struct {
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Resource    string    `json:"resource" db:"resource"`
	Action      string    `json:"action" db:"action"`
	Description string    `json:"description" db:"description"`
	Category    string    `json:"category" db:"category"`
	CreatedAt   time.Time `json:"createdAt" db:"created_at"`
}

// UserRole represents the assignment of a role to a user
type UserRole struct {
	ID             string     `json:"id" db:"id"`
	UserID         string     `json:"userId" db:"user_id"`
	RoleID         string     `json:"roleId" db:"role_id"`
	OrganizationID string     `json:"organizationId" db:"organization_id"`
	AssignedBy     string     `json:"assignedBy" db:"assigned_by"`
	AssignedAt     time.Time  `json:"assignedAt" db:"assigned_at"`
	ExpiresAt      *time.Time `json:"expiresAt,omitempty" db:"expires_at"`
	IsActive       bool       `json:"isActive" db:"is_active"`
}

// ResourcePermission represents permissions for specific resources
type ResourcePermission struct {
	ID             string                 `json:"id" db:"id"`
	UserID         string                 `json:"userId" db:"user_id"`
	ResourceType   string                 `json:"resourceType" db:"resource_type"`
	ResourceID     string                 `json:"resourceId" db:"resource_id"`
	OrganizationID string                 `json:"organizationId" db:"organization_id"`
	Permissions    []string               `json:"permissions" db:"permissions"`
	GrantedBy      string                 `json:"grantedBy" db:"granted_by"`
	GrantedAt      time.Time              `json:"grantedAt" db:"granted_at"`
	ExpiresAt      *time.Time             `json:"expiresAt,omitempty" db:"expires_at"`
	Metadata       map[string]interface{} `json:"metadata" db:"metadata"`
}

// APIKey represents an API key for programmatic access
type APIKey struct {
	ID             string                 `json:"id" db:"id"`
	UserID         string                 `json:"userId" db:"user_id"`
	OrganizationID string                 `json:"organizationId" db:"organization_id"`
	Name           string                 `json:"name" db:"name"`
	Description    string                 `json:"description" db:"description"`
	KeyHash        string                 `json:"-" db:"key_hash"`
	KeyPrefix      string                 `json:"keyPrefix" db:"key_prefix"`
	Permissions    []string               `json:"permissions" db:"permissions"`
	Scopes         []string               `json:"scopes" db:"scopes"`
	IsActive       bool                   `json:"isActive" db:"is_active"`
	LastUsedAt     *time.Time             `json:"lastUsedAt,omitempty" db:"last_used_at"`
	ExpiresAt      *time.Time             `json:"expiresAt,omitempty" db:"expires_at"`
	CreatedAt      time.Time              `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time              `json:"updatedAt" db:"updated_at"`
	Metadata       map[string]interface{} `json:"metadata" db:"metadata"`
}

// Session represents a user session
type Session struct {
	ID             string                 `json:"id" db:"id"`
	UserID         string                 `json:"userId" db:"user_id"`
	OrganizationID string                 `json:"organizationId" db:"organization_id"`
	TokenHash      string                 `json:"-" db:"token_hash"`
	IPAddress      string                 `json:"ipAddress" db:"ip_address"`
	UserAgent      string                 `json:"userAgent" db:"user_agent"`
	IsActive       bool                   `json:"isActive" db:"is_active"`
	LastActivityAt time.Time              `json:"lastActivityAt" db:"last_activity_at"`
	ExpiresAt      time.Time              `json:"expiresAt" db:"expires_at"`
	CreatedAt      time.Time              `json:"createdAt" db:"created_at"`
	Metadata       map[string]interface{} `json:"metadata" db:"metadata"`
}

// Permission constants for common actions
const (
	// Infrastructure permissions
	PermissionInfrastructureView   = "infrastructure:view"
	PermissionInfrastructureCreate = "infrastructure:create"
	PermissionInfrastructureUpdate = "infrastructure:update"
	PermissionInfrastructureDelete = "infrastructure:delete"
	PermissionInfrastructureManage = "infrastructure:manage"

	// Deployment permissions
	PermissionDeploymentView   = "deployment:view"
	PermissionDeploymentCreate = "deployment:create"
	PermissionDeploymentUpdate = "deployment:update"
	PermissionDeploymentDelete = "deployment:delete"
	PermissionDeploymentManage = "deployment:manage"

	// Security permissions
	PermissionSecurityView   = "security:view"
	PermissionSecurityScan   = "security:scan"
	PermissionSecurityManage = "security:manage"

	// Compliance permissions
	PermissionComplianceView   = "compliance:view"
	PermissionComplianceManage = "compliance:manage"
	PermissionComplianceAudit  = "compliance:audit"

	// User management permissions
	PermissionUserView   = "user:view"
	PermissionUserCreate = "user:create"
	PermissionUserUpdate = "user:update"
	PermissionUserDelete = "user:delete"
	PermissionUserManage = "user:manage"

	// Organization permissions
	PermissionOrgView   = "organization:view"
	PermissionOrgUpdate = "organization:update"
	PermissionOrgManage = "organization:manage"

	// Cost management permissions
	PermissionCostView   = "cost:view"
	PermissionCostManage = "cost:manage"

	// Monitoring permissions
	PermissionMonitoringView   = "monitoring:view"
	PermissionMonitoringManage = "monitoring:manage"

	// Admin permissions
	PermissionAdminFull = "admin:full"
)

// System roles
const (
	RoleSystemAdmin           = "system_admin"
	RoleOrganizationAdmin     = "organization_admin"
	RoleInfrastructureManager = "infrastructure_manager"
	RoleDeploymentManager     = "deployment_manager"
	RoleSecurityManager       = "security_manager"
	RoleComplianceManager     = "compliance_manager"
	RoleDeveloper             = "developer"
	RoleViewer                = "viewer"
)

// Resource types for RBAC
const (
	ResourceTypeInfrastructure = "infrastructure"
	ResourceTypeDeployment     = "deployment"
	ResourceTypeProject        = "project"
	ResourceTypeEnvironment    = "environment"
	ResourceTypeSecurityScan   = "security_scan"
	ResourceTypeCompliance     = "compliance"
	ResourceTypeRBAC           = "rbac"
)

// UserPermissions represents the effective permissions for a user
type UserPermissions struct {
	UserID         string                         `json:"userId"`
	OrganizationID string                         `json:"organizationId"`
	Roles          []Role                         `json:"roles"`
	Permissions    []string                       `json:"permissions"`
	ResourcePerms  map[string]map[string][]string `json:"resourcePermissions"` // resourceType -> resourceId -> permissions
	IsAdmin        bool                           `json:"isAdmin"`
	LastUpdated    time.Time                      `json:"lastUpdated"`
}

// PermissionCheck represents a permission check request
type PermissionCheck struct {
	UserID         string `json:"userId"`
	OrganizationID string `json:"organizationId"`
	Permission     string `json:"permission"`
	ResourceType   string `json:"resourceType,omitempty"`
	ResourceID     string `json:"resourceId,omitempty"`
}

// PermissionResult represents the result of a permission check
type PermissionResult struct {
	Allowed   bool       `json:"allowed"`
	Reason    string     `json:"reason,omitempty"`
	GrantedBy string     `json:"grantedBy,omitempty"`
	ExpiresAt *time.Time `json:"expiresAt,omitempty"`
}
