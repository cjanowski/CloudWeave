package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"cloudweave/internal/models"
	"cloudweave/internal/services"
)

// ComplianceGinHandler handles compliance-related HTTP requests using Gin
type ComplianceGinHandler struct {
	complianceService *services.ComplianceService
}

// NewComplianceGinHandler creates a new compliance handler for Gin
func NewComplianceGinHandler(complianceService *services.ComplianceService) *ComplianceGinHandler {
	return &ComplianceGinHandler{
		complianceService: complianceService,
	}
}

// Framework endpoints

// CreateFramework handles POST /api/compliance/frameworks
func (h *ComplianceGinHandler) CreateFramework(c *gin.Context) {
	var framework models.ComplianceFrameworkConfig
	if err := c.ShouldBindJSON(&framework); err != nil {
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

	framework.OrganizationID = orgID.(string)

	if err := h.complianceService.CreateFramework(c.Request.Context(), &framework, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, framework)
}

// GetFramework handles GET /api/compliance/frameworks/:id
func (h *ComplianceGinHandler) GetFramework(c *gin.Context) {
	frameworkID := c.Param("id")

	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	framework, err := h.complianceService.GetFramework(c.Request.Context(), orgID.(string), frameworkID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, framework)
}

// ListFrameworks handles GET /api/compliance/frameworks
func (h *ComplianceGinHandler) ListFrameworks(c *gin.Context) {
	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	// Parse query parameters
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	frameworks, total, err := h.complianceService.ListFrameworks(c.Request.Context(), orgID.(string), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"frameworks": frameworks,
		"total":      total,
		"limit":      limit,
		"offset":     offset,
	})
}

// UpdateFramework handles PUT /api/compliance/frameworks/:id
func (h *ComplianceGinHandler) UpdateFramework(c *gin.Context) {
	frameworkID := c.Param("id")

	var framework models.ComplianceFrameworkConfig
	if err := c.ShouldBindJSON(&framework); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	framework.ID = frameworkID

	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}
	framework.OrganizationID = orgID.(string)

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := h.complianceService.UpdateFramework(c.Request.Context(), &framework, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, framework)
}

// DeleteFramework handles DELETE /api/compliance/frameworks/:id
func (h *ComplianceGinHandler) DeleteFramework(c *gin.Context) {
	frameworkID := c.Param("id")

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

	if err := h.complianceService.DeleteFramework(c.Request.Context(), orgID.(string), frameworkID, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// GetControlStatistics handles GET /api/compliance/frameworks/:id/statistics
func (h *ComplianceGinHandler) GetControlStatistics(c *gin.Context) {
	frameworkID := c.Param("id")

	stats, err := h.complianceService.GetControlStatistics(c.Request.Context(), frameworkID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// Assessment endpoints

// CreateAssessment handles POST /api/compliance/assessments
func (h *ComplianceGinHandler) CreateAssessment(c *gin.Context) {
	var assessment models.ComplianceAssessment
	if err := c.ShouldBindJSON(&assessment); err != nil {
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

	assessment.OrganizationID = orgID.(string)

	if err := h.complianceService.CreateAssessment(c.Request.Context(), &assessment, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, assessment)
}

// ListAssessments handles GET /api/compliance/assessments
func (h *ComplianceGinHandler) ListAssessments(c *gin.Context) {
	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	// Parse query parameters
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	assessments, total, err := h.complianceService.ListAssessments(c.Request.Context(), orgID.(string), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"assessments": assessments,
		"total":       total,
		"limit":       limit,
		"offset":      offset,
	})
}

// RunAssessment handles POST /api/compliance/assessments/:id/run
func (h *ComplianceGinHandler) RunAssessment(c *gin.Context) {
	assessmentID := c.Param("id")

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

	if err := h.complianceService.RunAssessment(c.Request.Context(), orgID.(string), assessmentID, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Assessment started successfully",
	})
}