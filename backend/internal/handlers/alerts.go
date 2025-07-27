package handlers

import (
	"net/http"
	"strconv"
	"time"

	"cloudweave/internal/services"
	"github.com/gin-gonic/gin"
)

type AlertsHandler struct {
	alertService *services.AlertService
}

func NewAlertsHandler(alertService *services.AlertService) *AlertsHandler {
	return &AlertsHandler{
		alertService: alertService,
	}
}

// GetAlerts retrieves alerts with filtering options
func (h *AlertsHandler) GetAlerts(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// Parse query parameters
	filters := services.AlertFilters{
		Status:     c.Query("status"),
		Severity:   c.Query("severity"),
		Type:       c.Query("type"),
		ResourceID: c.Query("resource_id"),
		Limit:      parseIntQuery(c, "limit", 50),
		Offset:     parseIntQuery(c, "offset", 0),
	}

	// Parse time filters if provided
	if startTimeStr := c.Query("start_time"); startTimeStr != "" {
		if startTime, err := time.Parse(time.RFC3339, startTimeStr); err == nil {
			filters.StartTime = &startTime
		}
	}
	if endTimeStr := c.Query("end_time"); endTimeStr != "" {
		if endTime, err := time.Parse(time.RFC3339, endTimeStr); err == nil {
			filters.EndTime = &endTime
		}
	}

	alerts, err := h.alertService.GetAlerts(c.Request.Context(), orgID, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"alerts": alerts})
}

// GetActiveAlerts retrieves active alerts for an organization
func (h *AlertsHandler) GetActiveAlerts(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	alerts, err := h.alertService.GetActiveAlerts(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"alerts": alerts})
}

// GetAlertSummary retrieves alert summary statistics
func (h *AlertsHandler) GetAlertSummary(c *gin.Context) {
	orgID := c.GetString("organizationId")
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "organization_id is required"})
		return
	}

	// For now, return mock data until the alerts service is fully implemented
	mockSummary := map[string]interface{}{
		"activeAlerts":        3,
		"criticalAlerts":      1,
		"warningAlerts":       2,
		"infoAlerts":          0,
		"acknowledgedAlerts":  5,
		"totalAlerts":         8,
		"lastUpdated":         "2025-07-26T20:30:00Z",
	}

	c.JSON(http.StatusOK, mockSummary)
}

// AcknowledgeAlert acknowledges an alert
func (h *AlertsHandler) AcknowledgeAlert(c *gin.Context) {
	alertID := c.Param("id")
	if alertID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "alert ID is required"})
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	if err := h.alertService.AcknowledgeAlert(c.Request.Context(), alertID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "alert acknowledged"})
}

// UpdateAlertStatus updates the status of an alert
func (h *AlertsHandler) UpdateAlertStatus(c *gin.Context) {
	alertID := c.Param("id")
	if alertID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "alert ID is required"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.alertService.UpdateAlertStatus(c.Request.Context(), alertID, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "alert status updated"})
}

// CreateAlertRule creates a new alert rule
func (h *AlertsHandler) CreateAlertRule(c *gin.Context) {
	var rule services.AlertRule
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.alertService.CreateAlertRule(c.Request.Context(), &rule); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "alert rule created", "rule": rule})
}

// Helper function to parse integer query parameters
func parseIntQuery(c *gin.Context, key string, defaultValue int) int {
	if str := c.Query(key); str != "" {
		if val, err := strconv.Atoi(str); err == nil {
			return val
		}
	}
	return defaultValue
}