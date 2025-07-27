package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"cloudweave/internal/models"
	"cloudweave/internal/services"
)

// RBACGinHandler handles RBAC-related HTTP requests using Gin
type RBACGinHandler struct {
	rbacService *services.RBACService
}

// NewRBACGinHandler creates a new RBAC handler for Gin
func NewRBACGinHandler(rbacService *services.RBACService) *RBACGinHandler {
	return &RBACGinHandler{
		rbacService: rbacService,
	}
}

// Role Management Endpoints

// CreateRole handles POST /api/rbac/roles
func (h *RBACGinHandler) CreateRole(c *gin.Context) {
	var role models.Role
	if err := c.ShouldBindJSON(&role); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get organization ID from context
	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	role.OrganizationID = orgID.(string)

	if err := h.rbacService.CreateRole(c.Request.Context(), &role, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, role)
}

// GetRole handles GET /api/rbac/roles/:id
func (h *RBACGinHandler) GetRole(c *gin.Context) {
	roleID := c.Param("id")

	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	role, err := h.rbacService.GetRole(c.Request.Context(), orgID.(string), roleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, role)
}

// ListRoles handles GET /api/rbac/roles
func (h *RBACGinHandler) ListRoles(c *gin.Context) {
	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	// Parse query parameters
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	roles, total, err := h.rbacService.ListRoles(c.Request.Context(), orgID.(string), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"roles":  roles,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// UpdateRole handles PUT /api/rbac/roles/:id
func (h *RBACGinHandler) UpdateRole(c *gin.Context) {
	roleID := c.Param("id")

	var role models.Role
	if err := c.ShouldBindJSON(&role); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	role.ID = roleID

	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}
	role.OrganizationID = orgID.(string)

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := h.rbacService.UpdateRole(c.Request.Context(), &role, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, role)
}

// DeleteRole handles DELETE /api/rbac/roles/:id
func (h *RBACGinHandler) DeleteRole(c *gin.Context) {
	roleID := c.Param("id")

	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := h.rbacService.DeleteRole(c.Request.Context(), orgID.(string), roleID, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// User Role Management Endpoints

// AssignRole handles POST /api/rbac/users/:userId/roles
func (h *RBACGinHandler) AssignRole(c *gin.Context) {
	userIDParam := c.Param("userId")

	var request struct {
		RoleID    string     `json:"roleId" binding:"required"`
		ExpiresAt *time.Time `json:"expiresAt,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	assignerID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := h.rbacService.AssignRole(c.Request.Context(), userIDParam, request.RoleID, orgID.(string), assignerID.(string), request.ExpiresAt); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role assigned successfully"})
}

// RemoveRole handles DELETE /api/rbac/users/:userId/roles/:roleId
func (h *RBACGinHandler) RemoveRole(c *gin.Context) {
	userIDParam := c.Param("userId")
	roleID := c.Param("roleId")

	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	removerID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := h.rbacService.RemoveRole(c.Request.Context(), userIDParam, roleID, orgID.(string), removerID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role removed successfully"})
}

// GetUserRoles handles GET /api/rbac/users/:userId/roles
func (h *RBACGinHandler) GetUserRoles(c *gin.Context) {
	userIDParam := c.Param("userId")

	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	userRoles, err := h.rbacService.GetUserRoles(c.Request.Context(), userIDParam, orgID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"userRoles": userRoles})
}

// GetUserPermissions handles GET /api/rbac/users/:userId/permissions
func (h *RBACGinHandler) GetUserPermissions(c *gin.Context) {
	userIDParam := c.Param("userId")

	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	permissions, err := h.rbacService.GetUserPermissions(c.Request.Context(), userIDParam, orgID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, permissions)
}

// Permission Checking Endpoints

// CheckPermission handles POST /api/rbac/check-permission
func (h *RBACGinHandler) CheckPermission(c *gin.Context) {
	var check models.PermissionCheck
	if err := c.ShouldBindJSON(&check); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	// If no user ID provided, use current user
	if check.UserID == "" {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}
		check.UserID = userID.(string)
	}

	// If no organization ID provided, use current organization
	if check.OrganizationID == "" {
		orgID, exists := c.Get("organizationID")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
			return
		}
		check.OrganizationID = orgID.(string)
	}

	result, err := h.rbacService.CheckPermission(c.Request.Context(), &check)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// API Key Management Endpoints

// CreateAPIKey handles POST /api/rbac/api-keys
func (h *RBACGinHandler) CreateAPIKey(c *gin.Context) {
	var request struct {
		Name        string     `json:"name" binding:"required"`
		Description string     `json:"description"`
		Permissions []string   `json:"permissions"`
		ExpiresAt   *time.Time `json:"expiresAt,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	apiKey, rawKey, err := h.rbacService.CreateAPIKey(c.Request.Context(),
		userID.(string), orgID.(string), request.Name, request.Description, request.Permissions, request.ExpiresAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"apiKey": apiKey,
		"key":    rawKey, // Only returned once during creation
	})
}

// ListAPIKeys handles GET /api/rbac/api-keys
func (h *RBACGinHandler) ListAPIKeys(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	_, exists = c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	// Parse query parameters
	_ = c.DefaultQuery("limit", "50")
	_ = c.DefaultQuery("offset", "0")

	// Note: This would need the APIKeyRepository to be implemented
	c.JSON(http.StatusNotImplemented, gin.H{"error": "API key listing not yet implemented"})
}

// System Endpoints

// InitializeSystemRoles handles POST /api/rbac/system/initialize
func (h *RBACGinHandler) InitializeSystemRoles(c *gin.Context) {
	// This should only be accessible by system administrators
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Check if user has admin privileges (this would need proper permission checking)
	// For now, we'll allow it but in production this should be restricted

	if err := h.rbacService.InitializeSystemRoles(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "System roles initialized successfully"})
}
