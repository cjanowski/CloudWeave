package handlers

import (
	"net/http"
	"strconv"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"
	"cloudweave/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type InfrastructureHandler struct {
	repoManager  *repositories.RepositoryManager
	infraService *services.InfrastructureService
}

func NewInfrastructureHandler(repoManager *repositories.RepositoryManager, infraService *services.InfrastructureService) *InfrastructureHandler {
	return &InfrastructureHandler{
		repoManager:  repoManager,
		infraService: infraService,
	}
}

// CreateInfrastructure creates a new infrastructure resource
// @Summary Create infrastructure resource
// @Description Create a new infrastructure resource in the specified cloud provider
// @Tags Infrastructure
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.CreateInfrastructureRequest true "Infrastructure creation details"
// @Success 201 {object} SuccessResponse{data=models.Infrastructure}
// @Failure 400 {object} ValidationErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /infrastructure [post]
func (h *InfrastructureHandler) CreateInfrastructure(c *gin.Context) {
	var req models.CreateInfrastructureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "VALIDATION_ERROR",
				Message:   "Invalid request format: " + err.Error(),
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Get organization ID from context (set by auth middleware)
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "UNAUTHORIZED",
				Message:   "Organization ID not found in context",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
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

// GetInfrastructureStats returns infrastructure statistics for overview
func (h *InfrastructureHandler) GetInfrastructureStats(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization ID not found"})
		return
	}

	// Add cache headers to help with client-side caching
	c.Header("Cache-Control", "public, max-age=30")
	c.Header("ETag", `"stats-v1"`)

	// Check if client has cached version
	if match := c.GetHeader("If-None-Match"); match == `"stats-v1"` {
		c.Status(http.StatusNotModified)
		return
	}

	// Get infrastructure data with optimized query
	infrastructures, err := h.repoManager.Infrastructure.List(c.Request.Context(), orgID.(string), repositories.ListParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get infrastructure data"})
		return
	}

	// Calculate statistics efficiently
	totalResources := len(infrastructures)
	activeInstances := 0
	networks := 0
	
	for _, infra := range infrastructures {
		if infra.Status == models.InfraStatusRunning {
			activeInstances++
		}
		if infra.Type == models.InfraTypeNetwork {
			networks++
		}
	}

	// Mock compliance score for now - in production, this would be calculated
	complianceScore := 98

	stats := gin.H{
		"totalResources":         totalResources,
		"totalResourcesChange":   "+12%",
		"totalResourcesTrend":    "up",
		"activeInstances":        activeInstances,
		"activeInstancesChange":  "+8%",
		"activeInstancesTrend":   "up",
		"networks":               networks,
		"networksChange":         "+2%",
		"networksTrend":          "up",
		"complianceScore":        complianceScore,
		"complianceScoreChange":  "+1%",
		"complianceScoreTrend":   "up",
		"lastUpdated":            time.Now().Unix(),
	}

	c.JSON(http.StatusOK, stats)
}

// GetResourceDistribution returns resource distribution data
func (h *InfrastructureHandler) GetResourceDistribution(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization ID not found"})
		return
	}

	// Add cache headers
	c.Header("Cache-Control", "public, max-age=60")
	c.Header("ETag", `"distribution-v1"`)

	// Check if client has cached version
	if match := c.GetHeader("If-None-Match"); match == `"distribution-v1"` {
		c.Status(http.StatusNotModified)
		return
	}

	// Get infrastructure data
	infrastructures, err := h.repoManager.Infrastructure.List(c.Request.Context(), orgID.(string), repositories.ListParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get infrastructure data"})
		return
	}

	// Calculate distribution efficiently
	distribution := make(map[string]int)
	typeMapping := map[string]string{
		models.InfraTypeServer:    "ec2Instances",
		models.InfraTypeStorage:   "s3Buckets",
		models.InfraTypeDatabase:  "rdsDatabases",
		models.InfraTypeContainer: "lambdaFunctions",
	}

	for _, infra := range infrastructures {
		if mappedType, exists := typeMapping[infra.Type]; exists {
			distribution[mappedType]++
		}
	}

	// Ensure all types are present
	result := gin.H{
		"ec2Instances":    distribution["ec2Instances"],
		"s3Buckets":       distribution["s3Buckets"],
		"rdsDatabases":    distribution["rdsDatabases"],
		"lambdaFunctions": distribution["lambdaFunctions"],
		"totalCount":      len(infrastructures),
		"lastUpdated":     time.Now().Unix(),
	}

	c.JSON(http.StatusOK, result)
}

// GetRecentChanges returns recent infrastructure changes
func (h *InfrastructureHandler) GetRecentChanges(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization ID not found"})
		return
	}

	// Add cache headers with shorter TTL for recent changes
	c.Header("Cache-Control", "public, max-age=15")
	c.Header("ETag", `"changes-v1"`)

	// Check if client has cached version
	if match := c.GetHeader("If-None-Match"); match == `"changes-v1"` {
		c.Status(http.StatusNotModified)
		return
	}

	// Get recent infrastructure changes (last 10)
	infrastructures, err := h.repoManager.Infrastructure.List(c.Request.Context(), orgID.(string), repositories.ListParams{
		Limit:  10,
		Offset: 0,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get infrastructure data"})
		return
	}

	// Convert to recent changes format efficiently
	changes := make([]gin.H, 0, len(infrastructures))
	for _, infra := range infrastructures {
		changeType := "created"
		timestamp := infra.CreatedAt
		
		if infra.UpdatedAt.After(infra.CreatedAt) {
			changeType = "updated"
			timestamp = infra.UpdatedAt
		}

		changes = append(changes, gin.H{
			"id":           infra.ID,
			"message":      "Infrastructure \"" + infra.Name + "\" " + changeType,
			"timestamp":    timestamp,
			"type":         changeType,
			"resourceId":   infra.ID,
			"resourceName": infra.Name,
			"provider":     infra.Provider,
			"status":       infra.Status,
		})
	}

	result := gin.H{
		"changes":     changes,
		"count":       len(changes),
		"lastUpdated": time.Now().Unix(),
	}

	c.JSON(http.StatusOK, result)
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

// GetInfrastructureBatch returns multiple infrastructure data types in a single request
func (h *InfrastructureHandler) GetInfrastructureBatch(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization ID not found"})
		return
	}

	// Parse requested data types from query parameters
	requestedTypes := c.QueryArray("types")
	if len(requestedTypes) == 0 {
		// Default to all types if none specified
		requestedTypes = []string{"stats", "distribution", "recent-changes"}
	}

	// Add cache headers
	c.Header("Cache-Control", "public, max-age=30")
	
	result := gin.H{
		"timestamp": time.Now().Unix(),
	}

	// Get infrastructure data once and reuse for all calculations
	infrastructures, err := h.repoManager.Infrastructure.List(c.Request.Context(), orgID.(string), repositories.ListParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get infrastructure data"})
		return
	}

	// Process each requested type
	for _, dataType := range requestedTypes {
		switch dataType {
		case "stats":
			result["stats"] = h.calculateStats(infrastructures)
		case "distribution":
			result["distribution"] = h.calculateDistribution(infrastructures)
		case "recent-changes":
			result["recentChanges"] = h.calculateRecentChanges(infrastructures[:min(10, len(infrastructures))])
		}
	}

	c.JSON(http.StatusOK, result)
}

// Helper functions for batch processing
func (h *InfrastructureHandler) calculateStats(infrastructures []*models.Infrastructure) gin.H {
	totalResources := len(infrastructures)
	activeInstances := 0
	networks := 0
	
	for _, infra := range infrastructures {
		if infra.Status == models.InfraStatusRunning {
			activeInstances++
		}
		if infra.Type == models.InfraTypeNetwork {
			networks++
		}
	}

	return gin.H{
		"totalResources":         totalResources,
		"totalResourcesChange":   "+12%",
		"totalResourcesTrend":    "up",
		"activeInstances":        activeInstances,
		"activeInstancesChange":  "+8%",
		"activeInstancesTrend":   "up",
		"networks":               networks,
		"networksChange":         "+2%",
		"networksTrend":          "up",
		"complianceScore":        98,
		"complianceScoreChange":  "+1%",
		"complianceScoreTrend":   "up",
	}
}

func (h *InfrastructureHandler) calculateDistribution(infrastructures []*models.Infrastructure) gin.H {
	distribution := make(map[string]int)
	typeMapping := map[string]string{
		models.InfraTypeServer:    "ec2Instances",
		models.InfraTypeStorage:   "s3Buckets",
		models.InfraTypeDatabase:  "rdsDatabases",
		models.InfraTypeContainer: "lambdaFunctions",
	}

	for _, infra := range infrastructures {
		if mappedType, exists := typeMapping[infra.Type]; exists {
			distribution[mappedType]++
		}
	}

	return gin.H{
		"ec2Instances":    distribution["ec2Instances"],
		"s3Buckets":       distribution["s3Buckets"],
		"rdsDatabases":    distribution["rdsDatabases"],
		"lambdaFunctions": distribution["lambdaFunctions"],
		"totalCount":      len(infrastructures),
	}
}

func (h *InfrastructureHandler) calculateRecentChanges(infrastructures []*models.Infrastructure) []gin.H {
	changes := make([]gin.H, 0, len(infrastructures))
	
	for _, infra := range infrastructures {
		changeType := "created"
		timestamp := infra.CreatedAt
		
		if infra.UpdatedAt.After(infra.CreatedAt) {
			changeType = "updated"
			timestamp = infra.UpdatedAt
		}

		changes = append(changes, gin.H{
			"id":           infra.ID,
			"message":      "Infrastructure \"" + infra.Name + "\" " + changeType,
			"timestamp":    timestamp,
			"type":         changeType,
			"resourceId":   infra.ID,
			"resourceName": infra.Name,
			"provider":     infra.Provider,
			"status":       infra.Status,
		})
	}

	return changes
}

// min returns the minimum of two integers (helper function)
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
