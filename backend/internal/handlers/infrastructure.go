package handlers

import (
	"net/http"
	"strconv"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"
	"cloudweave/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type InfrastructureHandler struct {
	repoManager *repositories.RepositoryManager
	infraService *services.InfrastructureService
}

func NewInfrastructureHandler(repoManager *repositories.RepositoryManager, infraService *services.InfrastructureService) *InfrastructureHandler {
	return &InfrastructureHandler{
		repoManager:  repoManager,
		infraService: infraService,
	}
}

// CreateInfrastructure creates a new infrastructure resource
func (h *InfrastructureHandler) CreateInfrastructure(c *gin.Context) {
	var req models.CreateInfrastructureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get organization ID from context (set by auth middleware)
	orgID, exists := c.Get("organizationID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	infrastructure := &models.Infrastructure{
		ID:             uuid.New().String(),
		OrganizationID: orgID.(string),
		Name:           req.Name,
		Type:           req.Type,
		Provider:       req.Provider,
		Region:         req.Region,
		Status:         models.InfraStatusPending,
		Specifications: req.Specifications,
		Tags:           req.Tags,
	}

	// Create infrastructure resource through service layer
	if err := h.infraService.CreateInfrastructure(c.Request.Context(), infrastructure); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, infrastructure)
}

// GetInfrastructure retrieves a specific infrastructure resource
func (h *InfrastructureHandler) GetInfrastructure(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Infrastructure ID is required"})
		return
	}

	infrastructure, err := h.repoManager.Infrastructure.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Get real-time status from cloud provider
	status, err := h.infraService.GetRealTimeStatus(c.Request.Context(), infrastructure)
	if err == nil && status != infrastructure.Status {
		// Update status if it has changed
		infrastructure.Status = status
		h.repoManager.Infrastructure.UpdateStatus(c.Request.Context(), id, status)
	}

	c.JSON(http.StatusOK, infrastructure)
}

// UpdateInfrastructure updates an existing infrastructure resource
func (h *InfrastructureHandler) UpdateInfrastructure(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Infrastructure ID is required"})
		return
	}

	var req models.UpdateInfrastructureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing infrastructure
	infrastructure, err := h.repoManager.Infrastructure.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Update fields if provided
	if req.Name != nil {
		infrastructure.Name = *req.Name
	}
	if req.Status != nil {
		infrastructure.Status = *req.Status
	}
	if req.Specifications != nil {
		infrastructure.Specifications = req.Specifications
	}
	if req.CostInfo != nil {
		infrastructure.CostInfo = req.CostInfo
	}
	if req.Tags != nil {
		infrastructure.Tags = req.Tags
	}
	if req.ExternalID != nil {
		infrastructure.ExternalID = req.ExternalID
	}

	if err := h.repoManager.Infrastructure.Update(c.Request.Context(), infrastructure); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, infrastructure)
}

// DeleteInfrastructure deletes an infrastructure resource
func (h *InfrastructureHandler) DeleteInfrastructure(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Infrastructure ID is required"})
		return
	}

	// Get infrastructure to check if it exists and get provider info
	infrastructure, err := h.repoManager.Infrastructure.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Delete from cloud provider if it has an external ID
	if infrastructure.ExternalID != nil {
		if err := h.infraService.DeleteFromProvider(c.Request.Context(), infrastructure); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete from cloud provider: " + err.Error()})
			return
		}
	}

	if err := h.repoManager.Infrastructure.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// ListInfrastructure lists infrastructure resources with filtering
func (h *InfrastructureHandler) ListInfrastructure(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	// Parse query parameters
	params := repositories.ListParams{
		Limit:  50, // default
		Offset: 0,
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 && limit <= 100 {
			params.Limit = limit
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil && offset >= 0 {
			params.Offset = offset
		}
	}

	provider := c.Query("provider")
	status := c.Query("status")
	infraType := c.Query("type")

	var infrastructures []*models.Infrastructure
	var err error

	// Filter by provider if specified
	if provider != "" {
		infrastructures, err = h.repoManager.Infrastructure.ListByProvider(c.Request.Context(), orgID.(string), provider, params)
	} else if status != "" {
		infrastructures, err = h.repoManager.Infrastructure.ListByStatus(c.Request.Context(), orgID.(string), status, params)
	} else {
		infrastructures, err = h.repoManager.Infrastructure.List(c.Request.Context(), orgID.(string), params)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Filter by type if specified (post-query filtering for simplicity)
	if infraType != "" {
		filtered := make([]*models.Infrastructure, 0)
		for _, infra := range infrastructures {
			if infra.Type == infraType {
				filtered = append(filtered, infra)
			}
		}
		infrastructures = filtered
	}

	c.JSON(http.StatusOK, gin.H{
		"data":   infrastructures,
		"count":  len(infrastructures),
		"limit":  params.Limit,
		"offset": params.Offset,
	})
}

// GetInfrastructureMetrics retrieves real-time metrics for an infrastructure resource
func (h *InfrastructureHandler) GetInfrastructureMetrics(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Infrastructure ID is required"})
		return
	}

	infrastructure, err := h.repoManager.Infrastructure.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	metrics, err := h.infraService.GetMetrics(c.Request.Context(), infrastructure)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, metrics)
}

// SyncInfrastructure syncs infrastructure state with cloud provider
func (h *InfrastructureHandler) SyncInfrastructure(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Infrastructure ID is required"})
		return
	}

	infrastructure, err := h.repoManager.Infrastructure.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	updatedInfra, err := h.infraService.SyncWithProvider(c.Request.Context(), infrastructure)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedInfra)
}

// GetProviders returns available cloud providers
func (h *InfrastructureHandler) GetProviders(c *gin.Context) {
	providers := []gin.H{
		{
			"id":      models.ProviderAWS,
			"name":    "Amazon Web Services",
			"regions": []string{"us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"},
		},
		{
			"id":      models.ProviderGCP,
			"name":    "Google Cloud Platform",
			"regions": []string{"us-central1", "us-east1", "europe-west1", "asia-southeast1"},
		},
		{
			"id":      models.ProviderAzure,
			"name":    "Microsoft Azure",
			"regions": []string{"eastus", "westus2", "westeurope", "southeastasia"},
		},
	}

	c.JSON(http.StatusOK, gin.H{"providers": providers})
}

// GetCostBreakdown retrieves cost breakdown for the organization
func (h *InfrastructureHandler) GetCostBreakdown(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	period := c.DefaultQuery("period", "monthly")
	
	costService := services.NewCostManagementService(h.repoManager, h.infraService.GetProviders())
	breakdown, err := costService.GetCostBreakdown(c.Request.Context(), orgID.(string), period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, breakdown)
}

// GetCostByTags retrieves cost breakdown by tags
func (h *InfrastructureHandler) GetCostByTags(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	var tags map[string]string
	if err := c.ShouldBindJSON(&tags); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	costService := services.NewCostManagementService(h.repoManager, h.infraService.GetProviders())
	costByTags, err := costService.GetCostByTags(c.Request.Context(), orgID.(string), tags)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"costByTags": costByTags})
}

// GetBudgetAlerts retrieves budget alerts for the organization
func (h *InfrastructureHandler) GetBudgetAlerts(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	costService := services.NewCostManagementService(h.repoManager, h.infraService.GetProviders())
	alerts, err := costService.GetBudgetAlerts(c.Request.Context(), orgID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"alerts": alerts})
}

// GetCostForecast retrieves cost forecast for the organization
func (h *InfrastructureHandler) GetCostForecast(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	costService := services.NewCostManagementService(h.repoManager, h.infraService.GetProviders())
	forecast, err := costService.GetCostForecast(c.Request.Context(), orgID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"forecast": forecast})
}

// GetDashboardMetrics retrieves dashboard metrics for the organization
func (h *InfrastructureHandler) GetDashboardMetrics(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	metricsService := services.NewMetricsService(h.repoManager, h.infraService.GetProviders())
	metrics, err := metricsService.GetDashboardMetrics(c.Request.Context(), orgID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, metrics)
}

// GetAggregatedMetrics retrieves aggregated metrics for the organization
func (h *InfrastructureHandler) GetAggregatedMetrics(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	metricsService := services.NewMetricsService(h.repoManager, h.infraService.GetProviders())
	metrics, err := metricsService.GetAggregatedMetrics(c.Request.Context(), orgID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"metrics": metrics})
}

// CollectMetrics triggers metrics collection for the organization
func (h *InfrastructureHandler) CollectMetrics(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	metricsService := services.NewMetricsService(h.repoManager, h.infraService.GetProviders())
	err := metricsService.CollectMetrics(c.Request.Context(), orgID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Metrics collection completed"})
}