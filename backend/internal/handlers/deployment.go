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

// GetEnvironments returns available deployment environments
func (h *DeploymentHandler) GetEnvironments(c *gin.Context) {
	environments := []gin.H{
		{
			"id":          models.EnvironmentDevelopment,
			"name":        "Development",
			"description": "Development environment for testing new features",
		},
		{
			"id":          models.EnvironmentStaging,
			"name":        "Staging",
			"description": "Pre-production environment for final testing",
		},
		{
			"id":          models.EnvironmentProduction,
			"name":        "Production",
			"description": "Live production environment",
		},
		{
			"id":          models.EnvironmentTesting,
			"name":        "Testing",
			"description": "Automated testing environment",
		},
	}

	c.JSON(http.StatusOK, gin.H{"environments": environments})
}