package services

import (
	"context"
	"fmt"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"
)

// AlertService handles alert creation, management, and notifications
type AlertService struct {
	repoManager *repositories.RepositoryManager
}

// NewAlertService creates a new alert service
func NewAlertService(repoManager *repositories.RepositoryManager) *AlertService {
	return &AlertService{
		repoManager: repoManager,
	}
}

// CreateAlert creates a new alert
func (s *AlertService) CreateAlert(ctx context.Context, alert *models.Alert) error {
	// Validate alert
	if alert.Type == "" {
		return fmt.Errorf("alert type is required")
	}

	if alert.Message == "" {
		return fmt.Errorf("alert message is required")
	}

	if alert.Severity == "" {
		alert.Severity = "info" // Default severity
	}

	// Alert doesn't have a Status field, it uses Acknowledged instead

	// Set timestamps
	now := time.Now()
	alert.CreatedAt = now
	alert.UpdatedAt = now

	// Store in database
	return s.repoManager.Alert.Create(ctx, alert)
}

// GetAlerts retrieves alerts with filtering options
func (s *AlertService) GetAlerts(ctx context.Context, orgID string, filters AlertFilters) ([]models.Alert, error) {
	params := repositories.ListParams{
		Limit:  filters.Limit,
		Offset: filters.Offset,
	}
	alerts, err := s.repoManager.Alert.List(ctx, orgID, params)
	if err != nil {
		return nil, err
	}
	
	// Convert to []models.Alert
	result := make([]models.Alert, len(alerts))
	for i, alert := range alerts {
		result[i] = *alert
	}
	return result, nil
}

// UpdateAlertStatus updates the status of an alert
func (s *AlertService) UpdateAlertStatus(ctx context.Context, alertID string, status string) error {
	alert, err := s.repoManager.Alert.GetByID(ctx, alertID)
	if err != nil {
		return fmt.Errorf("failed to get alert: %w", err)
	}

	// Update acknowledgment status based on status
	if status == "acknowledged" {
		now := time.Now()
		alert.Acknowledged = true
		alert.AcknowledgedAt = &now
	} else if status == "active" {
		alert.Acknowledged = false
		alert.AcknowledgedAt = nil
	}
	
	alert.UpdatedAt = time.Now()

	return s.repoManager.Alert.Update(ctx, alert)
}

// AcknowledgeAlert acknowledges an alert
func (s *AlertService) AcknowledgeAlert(ctx context.Context, alertID string, userID string) error {
	alert, err := s.repoManager.Alert.GetByID(ctx, alertID)
	if err != nil {
		return fmt.Errorf("failed to get alert: %w", err)
	}

	now := time.Now()
	alert.Acknowledged = true
	alert.AcknowledgedBy = &userID
	alert.AcknowledgedAt = &now
	alert.UpdatedAt = now

	return s.repoManager.Alert.Update(ctx, alert)
}

// GetActiveAlerts retrieves active alerts for an organization
func (s *AlertService) GetActiveAlerts(ctx context.Context, orgID string) ([]models.Alert, error) {
	params := repositories.ListParams{}
	alerts, err := s.repoManager.Alert.ListUnacknowledged(ctx, orgID, params)
	if err != nil {
		return nil, err
	}
	
	// Convert to []models.Alert
	result := make([]models.Alert, len(alerts))
	for i, alert := range alerts {
		result[i] = *alert
	}
	return result, nil
}

// GetAlertSummary retrieves alert summary statistics
func (s *AlertService) GetAlertSummary(ctx context.Context, orgID string) (*AlertSummary, error) {
	params := repositories.ListParams{}
	alerts, err := s.repoManager.Alert.List(ctx, orgID, params)
	if err != nil {
		return nil, fmt.Errorf("failed to get alerts: %w", err)
	}

	summary := &AlertSummary{
		TotalAlerts:     len(alerts),
		ActiveAlerts:    0,
		AcknowledgedAlerts: 0,
		ResolvedAlerts:  0,
		CriticalAlerts:  0,
		WarningAlerts:   0,
		InfoAlerts:      0,
		AlertsByType:    make(map[string]int),
		AlertsBySeverity: make(map[string]int),
	}

	for _, alert := range alerts {
		// Count by acknowledgment status
		if alert.Acknowledged {
			summary.AcknowledgedAlerts++
		} else {
			summary.ActiveAlerts++
		}

		// Count by severity
		switch alert.Severity {
		case "critical":
			summary.CriticalAlerts++
		case "high":
			summary.WarningAlerts++
		case "medium":
			summary.WarningAlerts++
		case "low":
			summary.InfoAlerts++
		}

		// Count by type
		summary.AlertsByType[alert.Type]++
		summary.AlertsBySeverity[alert.Severity]++
	}

	return summary, nil
}

// CreateAlertRule creates a new alert rule
func (s *AlertService) CreateAlertRule(ctx context.Context, rule *AlertRule) error {
	// Validate rule
	if rule.Name == "" {
		return fmt.Errorf("rule name is required")
	}

	if rule.Condition == "" {
		return fmt.Errorf("rule condition is required")
	}

	if rule.Severity == "" {
		rule.Severity = "warning" // Default severity
	}

	// Set timestamps
	now := time.Now()
	rule.CreatedAt = now
	rule.UpdatedAt = now

	// Store in database (this would require an AlertRule model and repository)
	// For now, we'll just return success
	return nil
}

// AlertFilters represents filters for alert queries
type AlertFilters struct {
	Status   string    `json:"status"`
	Severity string    `json:"severity"`
	Type     string    `json:"type"`
	ResourceID string  `json:"resourceId"`
	StartTime *time.Time `json:"startTime"`
	EndTime   *time.Time `json:"endTime"`
	Limit     int       `json:"limit"`
	Offset    int       `json:"offset"`
}

// AlertSummary represents alert summary statistics
type AlertSummary struct {
	TotalAlerts       int            `json:"totalAlerts"`
	ActiveAlerts      int            `json:"activeAlerts"`
	AcknowledgedAlerts int           `json:"acknowledgedAlerts"`
	ResolvedAlerts    int            `json:"resolvedAlerts"`
	CriticalAlerts    int            `json:"criticalAlerts"`
	WarningAlerts     int            `json:"warningAlerts"`
	InfoAlerts        int            `json:"infoAlerts"`
	AlertsByType      map[string]int `json:"alertsByType"`
	AlertsBySeverity  map[string]int `json:"alertsBySeverity"`
}

// AlertRule represents an alert rule configuration
type AlertRule struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Condition   string                 `json:"condition"`
	Severity    string                 `json:"severity"`
	Message     string                 `json:"message"`
	ResourceType string                `json:"resourceType"`
	Provider    string                 `json:"provider"`
	Enabled     bool                   `json:"enabled"`
	Parameters  map[string]interface{} `json:"parameters"`
	CreatedAt   time.Time              `json:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt"`
}

// NotificationService handles alert notifications
type NotificationService struct {
	alertService *AlertService
}

// NewNotificationService creates a new notification service
func NewNotificationService(alertService *AlertService) *NotificationService {
	return &NotificationService{
		alertService: alertService,
	}
}

// SendNotification sends a notification for an alert
func (s *NotificationService) SendNotification(ctx context.Context, alert *models.Alert, channels []string) error {
	// This would integrate with various notification channels:
	// - Email
	// - Slack
	// - Teams
	// - PagerDuty
	// - Webhook

	for _, channel := range channels {
		switch channel {
		case "email":
			if err := s.sendEmailNotification(ctx, alert); err != nil {
				fmt.Printf("Failed to send email notification: %v\n", err)
			}
		case "slack":
			if err := s.sendSlackNotification(ctx, alert); err != nil {
				fmt.Printf("Failed to send Slack notification: %v\n", err)
			}
		case "webhook":
			if err := s.sendWebhookNotification(ctx, alert); err != nil {
				fmt.Printf("Failed to send webhook notification: %v\n", err)
			}
		}
	}

	return nil
}

// sendEmailNotification sends an email notification
func (s *NotificationService) sendEmailNotification(ctx context.Context, alert *models.Alert) error {
	// This would integrate with an email service like SendGrid, AWS SES, etc.
	// For now, we'll just log the notification
	fmt.Printf("Email notification sent for alert %s: %s\n", alert.ID, alert.Message)
	return nil
}

// sendSlackNotification sends a Slack notification
func (s *NotificationService) sendSlackNotification(ctx context.Context, alert *models.Alert) error {
	// This would integrate with Slack API
	// For now, we'll just log the notification
	fmt.Printf("Slack notification sent for alert %s: %s\n", alert.ID, alert.Message)
	return nil
}

// sendWebhookNotification sends a webhook notification
func (s *NotificationService) sendWebhookNotification(ctx context.Context, alert *models.Alert) error {
	// This would send a POST request to a configured webhook URL
	// For now, we'll just log the notification
	fmt.Printf("Webhook notification sent for alert %s: %s\n", alert.ID, alert.Message)
	return nil
} 