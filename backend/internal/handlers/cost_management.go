package handlers

import (
	"net/http"

	"cloudweave/internal/repositories"
	"cloudweave/internal/services"

	"github.com/gin-gonic/gin"
)

type CostManagementHandler struct {
	repoManager *repositories.RepositoryManager
	costService *services.CostManagementService
}

func NewCostManagementHandler(repoManager *repositories.RepositoryManager, costService *services.CostManagementService) *CostManagementHandler {
	return &CostManagementHandler{
		repoManager: repoManager,
		costService: costService,
	}
}

// GetCostOverview retrieves cost overview for the organization
func (h *CostManagementHandler) GetCostOverview(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Get cost breakdown as overview
	period := c.DefaultQuery("period", "month")
	breakdown, err := h.costService.GetCostBreakdown(c.Request.Context(), orgID, period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get cost overview"})
		return
	}

	c.JSON(http.StatusOK, breakdown)
}

// GetCostBreakdown retrieves detailed cost breakdown
func (h *CostManagementHandler) GetCostBreakdown(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Parse query parameters
	period := c.DefaultQuery("period", "month")

	// Get cost breakdown from service
	breakdown, err := h.costService.GetCostBreakdown(c.Request.Context(), orgID, period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get cost breakdown"})
		return
	}

	c.JSON(http.StatusOK, breakdown)
}

// GetCostOptimization retrieves cost optimization recommendations
func (h *CostManagementHandler) GetCostOptimization(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Get cost breakdown which includes recommendations
	period := c.DefaultQuery("period", "month")
	breakdown, err := h.costService.GetCostBreakdown(c.Request.Context(), orgID, period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get optimization recommendations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"recommendations": breakdown.Recommendations})
}

// GetBillingHistory retrieves billing history
func (h *CostManagementHandler) GetBillingHistory(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Get cost forecast as billing history
	forecast, err := h.costService.GetCostForecast(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get billing history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"history": forecast})
}

// GetBudgetAlerts retrieves budget alerts
func (h *CostManagementHandler) GetBudgetAlerts(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Get budget alerts from service
	alerts, err := h.costService.GetBudgetAlerts(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get budget alerts"})
		return
	}

	c.JSON(http.StatusOK, alerts)
}

// GetCostByTags retrieves cost breakdown by tags
func (h *CostManagementHandler) GetCostByTags(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Parse tags from request body
	var tags map[string]string
	if err := c.ShouldBindJSON(&tags); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tags format"})
		return
	}

	// Get cost by tags from service
	costByTags, err := h.costService.GetCostByTags(c.Request.Context(), orgID, tags)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get cost by tags"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"costByTags": costByTags})
}

// GetRealTimeCostMonitoring retrieves real-time cost monitoring data
func (h *CostManagementHandler) GetRealTimeCostMonitoring(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Get real-time cost monitoring data
	realTimeData, err := h.costService.GetRealTimeCostMonitoring(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get real-time cost monitoring"})
		return
	}

	c.JSON(http.StatusOK, realTimeData)
}

// GetCostAllocationByTags retrieves detailed cost allocation by tags and projects
func (h *CostManagementHandler) GetCostAllocationByTags(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Get cost allocation by tags
	allocationData, err := h.costService.GetCostAllocationByTags(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get cost allocation by tags"})
		return
	}

	c.JSON(http.StatusOK, allocationData)
}

// GetCostOptimizationRecommendations retrieves detailed cost optimization recommendations
func (h *CostManagementHandler) GetCostOptimizationRecommendations(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Get cost optimization recommendations
	recommendations, err := h.costService.GetCostOptimizationRecommendations(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get cost optimization recommendations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"recommendations": recommendations})
}

// CreateBudget creates a new budget
func (h *CostManagementHandler) CreateBudget(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Budget creation not implemented yet"})
}

// GetBudgets retrieves all budgets for the organization
func (h *CostManagementHandler) GetBudgets(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Budget retrieval not implemented yet"})
}
