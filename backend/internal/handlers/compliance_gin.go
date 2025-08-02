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

// GetMetrics handles GET /api/compliance/metrics
func (h *ComplianceGinHandler) GetMetrics(c *gin.Context) {
	_, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	// For now, return mock compliance metrics
	// In a real implementation, this would aggregate data from the compliance service
	metrics := gin.H{
		"overallScore": 87.5,
		"frameworkScores": gin.H{
			"soc2":     92.0,
			"iso27001": 85.0,
			"gdpr":     89.0,
		},
		"totalControls":  156,
		"passedControls": 136,
		"failedControls": 12,
		"controlsBySeverity": gin.H{
			"critical": 2,
			"high":     5,
			"medium":   8,
			"low":      3,
			"info":     0,
		},
		"controlsByStatus": gin.H{
			"compliant":     136,
			"non_compliant": 12,
			"pending":       8,
		},
		"frameworkCompliance": gin.H{
			"soc2":     "compliant",
			"iso27001": "partial",
			"gdpr":     "compliant",
		},
		"recentAssessments":  3,
		"pendingRemediation": 8,
		"overdueControls":    2,
		"complianceTrends": []gin.H{
			{
				"date":         "2025-01-20",
				"overallScore": 85.0,
				"frameworkScores": gin.H{
					"soc2":     90.0,
					"iso27001": 82.0,
					"gdpr":     87.0,
				},
				"controlsPassed": 132,
				"controlsFailed": 16,
			},
			{
				"date":         "2025-01-27",
				"overallScore": 87.5,
				"frameworkScores": gin.H{
					"soc2":     92.0,
					"iso27001": 85.0,
					"gdpr":     89.0,
				},
				"controlsPassed": 136,
				"controlsFailed": 12,
			},
		},
	}

	c.JSON(http.StatusOK, metrics)
}

// GetViolations handles GET /api/compliance/violations
func (h *ComplianceGinHandler) GetViolations(c *gin.Context) {
	_, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization not found"})
		return
	}

	// For now, return mock compliance violations
	// In a real implementation, this would fetch actual violations from the database
	violations := []gin.H{
		{
			"id":          "1",
			"title":       "Unencrypted Data Storage",
			"description": "Database contains unencrypted sensitive data",
			"severity":    "critical",
			"framework":   "SOC 2",
			"controlId":   "CC6.1",
			"status":      "open",
			"dueDate":     "2025-02-15",
			"owner":       "Security Team",
			"remediation": "Enable encryption at rest for all databases",
			"createdAt":   "2025-01-25T00:00:00Z",
		},
		{
			"id":          "2",
			"title":       "Missing Access Reviews",
			"description": "Quarterly access reviews not completed",
			"severity":    "high",
			"framework":   "ISO 27001",
			"controlId":   "A.9.2.5",
			"status":      "in_progress",
			"dueDate":     "2025-02-10",
			"owner":       "IT Team",
			"remediation": "Complete quarterly access review process",
			"createdAt":   "2025-01-20T00:00:00Z",
		},
		{
			"id":          "3",
			"title":       "Data Retention Policy",
			"description": "Personal data retention exceeds GDPR limits",
			"severity":    "medium",
			"framework":   "GDPR",
			"controlId":   "Art.5.1.e",
			"status":      "open",
			"dueDate":     "2025-02-20",
			"owner":       "Legal Team",
			"remediation": "Update data retention policies and implement automated deletion",
			"createdAt":   "2025-01-22T00:00:00Z",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"violations": violations,
		"total":      len(violations),
	})
}
