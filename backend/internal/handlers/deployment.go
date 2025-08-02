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

type DeploymentHandler struct {
	repoManager       *repositories.RepositoryManager
	deploymentService *services.DeploymentService
}

func NewDeploymentHandler(repoManager *repositories.RepositoryManager, deploymentService *services.DeploymentService) *DeploymentHandler {
	return &DeploymentHandler{
		repoManager:       repoManager,
		deploymentService: deploymentService,
	}
}

// CreateDeployment creates a new deployment
func (h *DeploymentHandler) CreateDeployment(c *gin.Context) {
	var req models.CreateDeploymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get organization ID and user ID from context
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	deployment := &models.Deployment{
		ID:             uuid.New().String(),
		OrganizationID: orgID.(string),
		Name:           req.Name,
		Application:    req.Application,
		Version:        req.Version,
		Environment:    req.Environment,
		Status:         models.DeploymentStatusPending,
		Progress:       0,
		Configuration:  req.Configuration,
		CreatedBy:      &[]string{userID.(string)}[0],
	}

	// Create deployment through service layer (handles orchestration)
	if err := h.deploymentService.CreateDeployment(c.Request.Context(), deployment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, deployment)
}

// GetDeployment retrieves a specific deployment
func (h *DeploymentHandler) GetDeployment(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deployment ID is required"})
		return
	}

	deployment, err := h.repoManager.Deployment.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, deployment)
}

// UpdateDeployment updates an existing deployment
func (h *DeploymentHandler) UpdateDeployment(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deployment ID is required"})
		return
	}

	var req models.UpdateDeploymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing deployment
	deployment, err := h.repoManager.Deployment.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Update fields if provided
	if req.Status != nil {
		deployment.Status = *req.Status
	}
	if req.Progress != nil {
		deployment.Progress = *req.Progress
	}
	if req.Configuration != nil {
		deployment.Configuration = req.Configuration
	}
	if req.StartedAt != nil {
		deployment.StartedAt = req.StartedAt
	}
	if req.CompletedAt != nil {
		deployment.CompletedAt = req.CompletedAt
	}

	if err := h.repoManager.Deployment.Update(c.Request.Context(), deployment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, deployment)
}

// DeleteDeployment deletes a deployment
func (h *DeploymentHandler) DeleteDeployment(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deployment ID is required"})
		return
	}

	if err := h.repoManager.Deployment.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// ListDeployments lists deployments with filtering
func (h *DeploymentHandler) ListDeployments(c *gin.Context) {
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

	environment := c.Query("environment")
	status := c.Query("status")
	application := c.Query("application")

	var deployments []*models.Deployment
	var err error

	// Filter by environment if specified
	if environment != "" {
		deployments, err = h.repoManager.Deployment.ListByEnvironment(c.Request.Context(), orgID.(string), environment, params)
	} else if status != "" {
		deployments, err = h.repoManager.Deployment.ListByStatus(c.Request.Context(), orgID.(string), status, params)
	} else {
		deployments, err = h.repoManager.Deployment.List(c.Request.Context(), orgID.(string), params)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Filter by application if specified (post-query filtering for simplicity)
	if application != "" {
		filtered := make([]*models.Deployment, 0)
		for _, deployment := range deployments {
			if deployment.Application == application {
				filtered = append(filtered, deployment)
			}
		}
		deployments = filtered
	}

	c.JSON(http.StatusOK, gin.H{
		"data":   deployments,
		"count":  len(deployments),
		"limit":  params.Limit,
		"offset": params.Offset,
	})
}

// GetDeploymentHistory retrieves deployment history for an application
func (h *DeploymentHandler) GetDeploymentHistory(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	application := c.Query("application")
	environment := c.Query("environment")

	if application == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Application parameter is required"})
		return
	}

	params := repositories.ListParams{
		Limit:  100, // More history records
		Offset: 0,
	}

	deployments, err := h.deploymentService.GetDeploymentHistory(c.Request.Context(), orgID.(string), application, environment, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        deployments,
		"application": application,
		"environment": environment,
		"count":       len(deployments),
	})
}

// GetDeploymentLogs retrieves logs for a specific deployment
func (h *DeploymentHandler) GetDeploymentLogs(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deployment ID is required"})
		return
	}

	logs, err := h.deploymentService.GetDeploymentLogs(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"deploymentId": id,
		"logs":         logs,
	})
}

// RollbackDeployment rolls back a deployment to a previous version
func (h *DeploymentHandler) RollbackDeployment(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deployment ID is required"})
		return
	}

	var req struct {
		TargetVersion string `json:"targetVersion" binding:"required"`
		Reason        string `json:"reason,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rollbackDeployment, err := h.deploymentService.RollbackDeployment(c.Request.Context(), id, req.TargetVersion, req.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, rollbackDeployment)
}

// CancelDeployment cancels a running deployment
func (h *DeploymentHandler) CancelDeployment(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deployment ID is required"})
		return
	}

	var req struct {
		Reason string `json:"reason,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.deploymentService.CancelDeployment(c.Request.Context(), id, req.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deployment cancelled successfully"})
}

// GetDeploymentStatus gets real-time deployment status
func (h *DeploymentHandler) GetDeploymentStatus(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deployment ID is required"})
		return
	}

	status, err := h.deploymentService.GetRealTimeStatus(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, status)
}

// GetDeploymentStats returns deployment statistics
func (h *DeploymentHandler) GetDeploymentStats(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	// Get all deployments for the organization
	allDeployments, err := h.repoManager.Deployment.List(c.Request.Context(), orgID.(string), repositories.ListParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Calculate statistics
	activeDeployments := 0
	successCount := 0
	failedCount := 0
	totalDuration := 0.0
	completedCount := 0

	for _, deployment := range allDeployments {
		if deployment.Status == "running" || deployment.Status == "pending" {
			activeDeployments++
		}
		if deployment.Status == "completed" {
			successCount++
			completedCount++
			if deployment.StartedAt != nil && deployment.CompletedAt != nil {
				duration := deployment.CompletedAt.Sub(*deployment.StartedAt).Minutes()
				totalDuration += duration
			}
		}
		if deployment.Status == "failed" {
			failedCount++
		}
	}

	var successRate float64 = 0
	if successCount+failedCount > 0 {
		successRate = float64(successCount) / float64(successCount+failedCount) * 100
	}

	var avgDeployTime float64 = 0
	if completedCount > 0 {
		avgDeployTime = totalDuration / float64(completedCount)
	}

	stats := gin.H{
		"activeDeployments":       activeDeployments,
		"activeDeploymentsChange": "+2",
		"activeDeploymentsTrend":  "up",
		"successRate":             successRate,
		"successRateChange":       "+5%",
		"successRateTrend":        "up",
		"failedDeployments":       failedCount,
		"failedDeploymentsChange": "-1",
		"failedDeploymentsTrend":  "down",
		"avgDeployTime":           avgDeployTime,
		"avgDeployTimeChange":     "-10%",
		"avgDeployTimeTrend":      "down",
	}

	c.JSON(http.StatusOK, stats)
}

// GetRecentDeployments returns recent deployments
func (h *DeploymentHandler) GetRecentDeployments(c *gin.Context) {
	orgID, exists := c.Get("organizationId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 100 {
		limit = 10
	}

	deployments, err := h.repoManager.Deployment.List(c.Request.Context(), orgID.(string), repositories.ListParams{
		Limit:  limit,
		Offset: 0,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, deployments)
}

// GetPipelines returns deployment pipelines
func (h *DeploymentHandler) GetPipelines(c *gin.Context) {
	// Mock pipeline data for now
	pipelines := []gin.H{
		{
			"id":         "pipeline-1",
			"name":       "Frontend Deploy Pipeline",
			"repository": "company/frontend",
			"branch":     "main",
			"status":     "success",
			"lastRun":    "2024-01-20T10:30:00Z",
			"stages": []gin.H{
				{
					"id":       "stage-1",
					"name":     "Build",
					"status":   "success",
					"duration": 120,
				},
				{
					"id":       "stage-2",
					"name":     "Test",
					"status":   "success",
					"duration": 90,
				},
				{
					"id":       "stage-3",
					"name":     "Deploy",
					"status":   "success",
					"duration": 45,
				},
			},
		},
		{
			"id":         "pipeline-2",
			"name":       "Backend API Pipeline",
			"repository": "company/backend",
			"branch":     "develop",
			"status":     "running",
			"lastRun":    "2024-01-20T11:00:00Z",
			"stages": []gin.H{
				{
					"id":       "stage-1",
					"name":     "Build",
					"status":   "success",
					"duration": 180,
				},
				{
					"id":       "stage-2",
					"name":     "Test",
					"status":   "running",
					"duration": nil,
				},
				{
					"id":       "stage-3",
					"name":     "Deploy",
					"status":   "pending",
					"duration": nil,
				},
			},
		},
	}

	c.JSON(http.StatusOK, pipelines)
}

// GetEnvironments returns available deployment environments
func (h *DeploymentHandler) GetEnvironments(c *gin.Context) {
	environments := []gin.H{
		{
			"id":            "dev",
			"name":          "development",
			"status":        "healthy",
			"servicesCount": 8,
			"uptime":        98.5,
		},
		{
			"id":            "staging",
			"name":          "staging",
			"status":        "healthy",
			"servicesCount": 12,
			"uptime":        99.2,
		},
		{
			"id":            "prod",
			"name":          "production",
			"status":        "healthy",
			"servicesCount": 15,
			"uptime":        99.9,
		},
		{
			"id":            "test",
			"name":          "testing",
			"status":        "warning",
			"servicesCount": 5,
			"uptime":        95.8,
		},
	}

	c.JSON(http.StatusOK, environments)
}
