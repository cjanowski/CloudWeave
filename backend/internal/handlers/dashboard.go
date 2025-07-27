package handlers

import (
	"context"
	"net/http"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"
	"cloudweave/internal/services"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	repoManager    *repositories.RepositoryManager
	metricsService *services.MetricsService
	alertService   *services.AlertService
}

func NewDashboardHandler(repoManager *repositories.RepositoryManager, metricsService *services.MetricsService, alertService *services.AlertService) *DashboardHandler {
	return &DashboardHandler{
		repoManager:    repoManager,
		metricsService: metricsService,
		alertService:   alertService,
	}
}

// GetDashboardStats retrieves dashboard statistics
func (h *DashboardHandler) GetDashboardStats(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Get infrastructure count
	infrastructures, err := h.repoManager.Infrastructure.List(c.Request.Context(), orgID, repositories.ListParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get infrastructure data"})
		return
	}

	// Get deployment count
	deployments, err := h.repoManager.Deployment.List(c.Request.Context(), orgID, repositories.ListParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get deployment data"})
		return
	}

	// Calculate stats
	activeResources := 0
	for _, infra := range infrastructures {
		if infra.Status == models.InfraStatusRunning {
			activeResources++
		}
	}

	// Mock data for now - in real implementation, these would come from actual metrics
	stats := map[string]interface{}{
		"activeResources":       activeResources,
		"activeResourcesChange": "+12%",
		"activeResourcesTrend":  "up",
		"deployments":           len(deployments),
		"deploymentsChange":     "+5%",
		"deploymentsTrend":      "up",
		"costThisMonth":         1234.56,
		"costThisMonthChange":   "-8%",
		"costThisMonthTrend":    "down",
		"uptime":                99.9876,
		"uptimeChange":          "+0.1%",
		"uptimeTrend":           "up",
	}

	c.JSON(http.StatusOK, stats)
}

// GetDashboardActivity retrieves recent dashboard activity
func (h *DashboardHandler) GetDashboardActivity(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Get recent deployments
	deployments, err := h.repoManager.Deployment.List(c.Request.Context(), orgID, repositories.ListParams{
		Limit:  10,
		Offset: 0,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get deployment data"})
		return
	}

	// Convert to activity format
	var activities []map[string]interface{}
	for _, deployment := range deployments {
		activities = append(activities, map[string]interface{}{
			"id":        deployment.ID,
			"message":   "Deployment \"" + deployment.Name + "\" " + deployment.Status,
			"timestamp": deployment.CreatedAt,
			"type":      "deployment",
		})
	}

	c.JSON(http.StatusOK, activities)
}

// GetPerformanceMetrics retrieves performance metrics
func (h *DashboardHandler) GetPerformanceMetrics(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Mock performance metrics - in real implementation, these would come from actual metrics
	metrics := map[string]interface{}{
		"cpuUsage":     45.2,
		"memoryUsage":  62.8,
		"networkIO":    1.2,
		"responseTime": 120,
		"timestamp":    "2025-01-27T12:00:00Z",
	}

	c.JSON(http.StatusOK, metrics)
}

// GetCostMetrics retrieves cost metrics
func (h *DashboardHandler) GetCostMetrics(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Mock cost metrics - in real implementation, these would come from actual cost data
	metrics := map[string]interface{}{
		"thisMonth":         1234.56,
		"lastMonth":         1342.78,
		"projected":         1180.00,
		"savings":           162.22,
		"savingsPercentage": 12.1,
	}

	c.JSON(http.StatusOK, metrics)
}

// GetSecurityMetrics retrieves security metrics
func (h *DashboardHandler) GetSecurityMetrics(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Mock security metrics - in real implementation, these would come from actual security data
	metrics := map[string]interface{}{
		"securityScore": 98,
		"vulnerabilities": map[string]interface{}{
			"critical": 0,
			"medium":   2,
			"low":      5,
		},
		"lastScan":   "2025-01-27T10:00:00Z",
		"compliance": []string{"SOC2", "ISO27001"},
	}

	c.JSON(http.StatusOK, metrics)
}

// GetInfrastructureMetrics retrieves infrastructure metrics
func (h *DashboardHandler) GetInfrastructureMetrics(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Get infrastructure data
	infrastructures, err := h.repoManager.Infrastructure.List(c.Request.Context(), orgID, repositories.ListParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get infrastructure data"})
		return
	}

	// Calculate metrics
	ec2Instances := 0
	loadBalancers := 0
	rdsCount := 0
	dynamodbCount := 0

	for _, infra := range infrastructures {
		switch infra.Type {
		case models.InfraTypeServer:
			ec2Instances++
		case models.InfraTypeDatabase:
			if infra.Provider == "aws" {
				rdsCount++
			} else {
				dynamodbCount++
			}
		}
	}

	metrics := map[string]interface{}{
		"ec2Instances":  ec2Instances,
		"loadBalancers": loadBalancers,
		"databases": map[string]interface{}{
			"rds":      rdsCount,
			"dynamodb": dynamodbCount,
		},
		"storageUsed": 2.4, // Mock data
	}

	c.JSON(http.StatusOK, metrics)
}

// GetReportsMetrics retrieves reports metrics
func (h *DashboardHandler) GetReportsMetrics(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Mock reports metrics - in real implementation, these would come from actual reports data
	metrics := map[string]interface{}{
		"monthlyReportAvailable":          true,
		"costOptimizationRecommendations": 15,
		"performanceTrend":                "improving",
		"nextSecurityAudit":               "2025-02-03T10:00:00Z",
	}

	c.JSON(http.StatusOK, metrics)
}

// GetDashboardOverview retrieves complete dashboard overview
func (h *DashboardHandler) GetDashboardOverview(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Get all dashboard data
	stats, err := h.getDashboardStatsData(orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dashboard stats"})
		return
	}

	activity, err := h.getDashboardActivityData(orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dashboard activity"})
		return
	}

	overview := map[string]interface{}{
		"stats":       stats,
		"activity":    activity,
		"lastUpdated": "2025-01-27T12:00:00Z",
	}

	c.JSON(http.StatusOK, overview)
}

// Helper methods
func (h *DashboardHandler) getDashboardStatsData(orgID string) (map[string]interface{}, error) {
	infrastructures, err := h.repoManager.Infrastructure.List(context.Background(), orgID, repositories.ListParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		return nil, err
	}

	deployments, err := h.repoManager.Deployment.List(context.Background(), orgID, repositories.ListParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		return nil, err
	}

	activeResources := 0
	for _, infra := range infrastructures {
		if infra.Status == models.InfraStatusRunning {
			activeResources++
		}
	}

	return map[string]interface{}{
		"activeResources":       activeResources,
		"activeResourcesChange": "+12%",
		"activeResourcesTrend":  "up",
		"deployments":           len(deployments),
		"deploymentsChange":     "+5%",
		"deploymentsTrend":      "up",
		"costThisMonth":         1234.56,
		"costThisMonthChange":   "-8%",
		"costThisMonthTrend":    "down",
		"uptime":                99.9876,
		"uptimeChange":          "+0.1%",
		"uptimeTrend":           "up",
	}, nil
}

func (h *DashboardHandler) getDashboardActivityData(orgID string) ([]map[string]interface{}, error) {
	deployments, err := h.repoManager.Deployment.List(context.Background(), orgID, repositories.ListParams{
		Limit:  10,
		Offset: 0,
	})
	if err != nil {
		return nil, err
	}

	var activities []map[string]interface{}
	for _, deployment := range deployments {
		activities = append(activities, map[string]interface{}{
			"id":        deployment.ID,
			"message":   "Deployment \"" + deployment.Name + "\" " + deployment.Status,
			"timestamp": deployment.CreatedAt,
			"type":      "deployment",
		})
	}

	return activities, nil
}
