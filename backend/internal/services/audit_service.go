package services

import (
	"context"
	"net"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AuditService provides methods for creating audit logs.
type AuditService struct {
	repo repositories.AuditLogRepositoryInterface
}

// NewAuditService creates a new AuditService.
func NewAuditService(repo repositories.AuditLogRepositoryInterface) *AuditService {
	return &AuditService{repo: repo}
}

// Record creates a new audit log entry.
func (s *AuditService) Record(ctx context.Context, action string, resourceType string, resourceID string, details map[string]interface{}) error {
	var userID, orgID, userAgent, ipAddress string

	if gc, ok := ctx.(*gin.Context); ok {
		if id, exists := gc.Get("userID"); exists {
			userID, _ = id.(string)
		}
		if id, exists := gc.Get("organizationId"); exists {
			orgID, _ = id.(string)
		}
		userAgent = gc.Request.UserAgent()
		ipAddress = gc.ClientIP()
	}

	id, err := uuid.NewRandom()
	if err != nil {
		return err
	}

	logEntry := &models.AuditLog{
		ID:             id.String(),
		OrganizationID: orgID,
		Action:         action,
		CreatedAt:      time.Now(),
	}

	if userID != "" {
		logEntry.UserID = &userID
	}
	if resourceType != "" {
		logEntry.ResourceType = &resourceType
	}
	if resourceID != "" {
		logEntry.ResourceID = &resourceID
	}
	if details != nil {
		logEntry.Details = details
	}
	if userAgent != "" {
		logEntry.UserAgent = &userAgent
	}
	if ip := net.ParseIP(ipAddress); ip != nil {
		logEntry.IPAddress = &ip
	}

	return s.repo.Create(ctx, logEntry)
}

// Query retrieves audit logs based on query parameters.
func (s *AuditService) Query(ctx context.Context, orgID string, query models.AuditLogQuery) ([]*models.AuditLog, error) {
	return s.repo.Query(ctx, orgID, query)
}

// GetActionSummary retrieves a summary of actions performed within a time range.
func (s *AuditService) GetActionSummary(ctx context.Context, orgID string, startTime, endTime time.Time) (map[string]int, error) {
	return s.repo.GetActionSummary(ctx, orgID, startTime, endTime)
}

// GetUserActivity retrieves user activity within a time range.
func (s *AuditService) GetUserActivity(ctx context.Context, orgID string, startTime, endTime time.Time) ([]map[string]interface{}, error) {
	return s.repo.GetUserActivity(ctx, orgID, startTime, endTime)
}

// CleanupOldAuditLogs removes audit logs older than the specified retention period.
func (s *AuditService) CleanupOldAuditLogs(ctx context.Context, retentionDays int) error {
	cutoffTime := time.Now().AddDate(0, 0, -retentionDays)
	return s.repo.DeleteOlderThan(ctx, cutoffTime.Format(time.RFC3339))
}
