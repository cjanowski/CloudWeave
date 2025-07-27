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

// CreateBudget creates a new budget
func (h *CostManagementHandler) CreateBudget(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Budget creation not implemented yet"})
}

// GetBudgets retrieves all budgets for the organization
func (h *CostManagementHandler) GetBudgets(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Budget retrieval not implemented yet"})
}
