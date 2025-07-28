package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/services"

	"github.com/gin-gonic/gin"
)

type AuditHandler struct {
	auditService *services.AuditService
}

func NewAuditHandler(auditService *services.AuditService) *AuditHandler {
	return &AuditHandler{auditService: auditService}
}

func (h *AuditHandler) GetAuditLogs(c *gin.Context) {
	var query models.AuditLogQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default time range if not provided
	if query.StartTime.IsZero() {
		query.StartTime = time.Now().Add(-24 * time.Hour)
	}
	if query.EndTime.IsZero() {
		query.EndTime = time.Now()
	}

	orgID, _ := c.Get("organizationId")
	logs, err := h.auditService.Query(c, orgID.(string), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, logs)
}

func (h *AuditHandler) GetComplianceReport(c *gin.Context) {
	startTimeStr := c.Query("startTime")
	endTimeStr := c.Query("endTime")

	var startTime, endTime time.Time
	var err error

	if startTimeStr != "" {
		startTime, err = time.Parse(time.RFC3339, startTimeStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid startTime format"})
			return
		}
	} else {
		startTime = time.Now().Add(-30 * 24 * time.Hour) // Default to 30 days ago
	}

	if endTimeStr != "" {
		endTime, err = time.Parse(time.RFC3339, endTimeStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid endTime format"})
			return
		}
	} else {
		endTime = time.Now()
	}

	orgID, _ := c.Get("organizationId")

	// Get action summary
	actionSummary, err := h.auditService.GetActionSummary(c, orgID.(string), startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get user activity
	userActivity, err := h.auditService.GetUserActivity(c, orgID.(string), startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	report := gin.H{
		"period": gin.H{
			"startTime": startTime,
			"endTime":   endTime,
		},
		"actionSummary": actionSummary,
		"userActivity":  userActivity,
		"generatedAt":   time.Now(),
	}

	c.JSON(http.StatusOK, report)
}

func (h *AuditHandler) CleanupOldLogs(c *gin.Context) {
	retentionDays := 90 // Default to 90 days
	if days := c.Query("retentionDays"); days != "" {
		if parsed, err := time.ParseDuration(days + "h"); err == nil {
			retentionDays = int(parsed.Hours() / 24)
		}
	}

	err := h.auditService.CleanupOldAuditLogs(c, retentionDays)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Old audit logs cleaned up successfully",
		"retentionDays": retentionDays,
	})
}

func (h *AuditHandler) ExportAuditLogs(c *gin.Context) {
	var query models.AuditLogQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default time range if not provided
	if query.StartTime.IsZero() {
		query.StartTime = time.Now().Add(-30 * 24 * time.Hour) // Default to 30 days ago
	}
	if query.EndTime.IsZero() {
		query.EndTime = time.Now()
	}

	orgID, _ := c.Get("organizationId")
	logs, err := h.auditService.Query(c, orgID.(string), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Set headers for CSV download
	filename := fmt.Sprintf("audit_logs_%s_to_%s.csv",
		query.StartTime.Format("2006-01-02"),
		query.EndTime.Format("2006-01-02"))
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	// Create CSV writer
	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// Write CSV header
	header := []string{"ID", "Timestamp", "User ID", "Action", "Resource Type", "Resource ID", "IP Address", "User Agent", "Details"}
	if err := writer.Write(header); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write CSV header"})
		return
	}

	// Write audit log data
	for _, log := range logs {
		var userID, resourceType, resourceID, ipAddress, userAgent string

		if log.UserID != nil {
			userID = *log.UserID
		}
		if log.ResourceType != nil {
			resourceType = *log.ResourceType
		}
		if log.ResourceID != nil {
			resourceID = *log.ResourceID
		}
		if log.IPAddress != nil {
			ipAddress = log.IPAddress.String()
		}
		if log.UserAgent != nil {
			userAgent = *log.UserAgent
		}

		details := ""
		if log.Details != nil {
			details = fmt.Sprintf("%v", log.Details)
		}

		record := []string{
			log.ID,
			log.CreatedAt.Format(time.RFC3339),
			userID,
			log.Action,
			resourceType,
			resourceID,
			ipAddress,
			userAgent,
			details,
		}

		if err := writer.Write(record); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write CSV record"})
			return
		}
	}
}
