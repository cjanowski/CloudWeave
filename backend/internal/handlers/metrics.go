package handlers

import (
	"net/http"
	"time"

	"cloudweave/internal/services"
	"github.com/gin-gonic/gin"
)

type MetricsHandler struct {
	metricsService *services.MetricsService
}

func NewMetricsHandler(metricsService *services.MetricsService) *MetricsHandler {
	return &MetricsHandler{
		metricsService: metricsService,
	}
}

// GetDashboardMetrics retrieves metrics for dashboard display
func (h *MetricsHandler) GetDashboardMetrics(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// For now, return mock data until the metrics service is fully implemented
	mockMetrics := map[string]interface{}{
		"totalResources":     12,
		"runningResources":   10,
		"stoppedResources":   2,
		"errorResources":     0,
		"totalCost":          245.67,
		"averageCpuUsage":    65.4,
		"averageMemoryUsage": 78.2,
		"resourceBreakdown": map[string]int{
			"ec2":    5,
			"rds":    2,
			"lambda": 3,
			"s3":     2,
		},
		"providerBreakdown": map[string]int{
			"aws":   8,
			"azure": 3,
			"gcp":   1,
		},
		"topResources": []map[string]interface{}{
			{
				"resourceId":   "i-1234567890abcdef0",
				"resourceName": "web-server-01",
				"resourceType": "ec2",
				"provider":     "aws",
				"status":       "running",
				"cpuUsage":     85.2,
				"memoryUsage":  72.1,
				"networkIn":    1024.5,
				"networkOut":   2048.3,
				"cost":         45.67,
				"lastUpdated":  "2025-07-26T20:30:00Z",
			},
		},
		"recentAlerts": []map[string]interface{}{},
	}

	c.JSON(http.StatusOK, mockMetrics)
}

// GetResourceMetrics retrieves metrics for a specific resource
func (h *MetricsHandler) GetResourceMetrics(c *gin.Context) {
	resourceID := c.Param("id")
	if resourceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "resource ID is required"})
		return
	}

	// Parse duration from query parameters (default: 24 hours)
	durationStr := c.DefaultQuery("duration", "24h")
	duration, err := time.ParseDuration(durationStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid duration format"})
		return
	}

	metrics, err := h.metricsService.GetResourceMetrics(c.Request.Context(), resourceID, duration)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"metrics": metrics})
}

// GetAggregatedMetrics retrieves aggregated metrics for an organization
func (h *MetricsHandler) GetAggregatedMetrics(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	metrics, err := h.metricsService.GetAggregatedMetrics(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"metrics": metrics})
}

// CollectMetrics triggers metrics collection for an organization
func (h *MetricsHandler) CollectMetrics(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	if err := h.metricsService.CollectMetrics(c.Request.Context(), orgID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "metrics collection started"})
}

// GetMetricDefinitions retrieves custom metric definitions
func (h *MetricsHandler) GetMetricDefinitions(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	definitions, err := h.metricsService.GetMetricDefinitions(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"definitions": definitions})
}

// StreamMetrics handles WebSocket connections for real-time metrics
func (h *MetricsHandler) StreamMetrics(c *gin.Context) {
	// This would be implemented with WebSocket streaming
	// For now, we'll return a simple response
	c.JSON(http.StatusOK, gin.H{"message": "metrics streaming endpoint"})
}
