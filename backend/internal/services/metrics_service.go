package services

import (
	"context"
	"fmt"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"
)

// MetricsService handles metrics collection, aggregation, and alerting
type MetricsService struct {
	repoManager  *repositories.RepositoryManager
	providers    map[string]CloudProvider
	alertService *AlertService
}

// NewMetricsService creates a new metrics service
func NewMetricsService(repoManager *repositories.RepositoryManager, providers map[string]CloudProvider) *MetricsService {
	return &MetricsService{
		repoManager:  repoManager,
		providers:    providers,
		alertService: NewAlertService(repoManager),
	}
}

// MetricData represents a single metric data point
type MetricData struct {
	ID           string                 `json:"id"`
	ResourceID   string                 `json:"resourceId"`
	ResourceType string                 `json:"resourceType"`
	MetricName   string                 `json:"metricName"`
	Value        float64                `json:"value"`
	Unit         string                 `json:"unit"`
	Timestamp    time.Time              `json:"timestamp"`
	Tags         map[string]string      `json:"tags"`
	Metadata     map[string]interface{} `json:"metadata"`
}

// MetricsAggregation represents aggregated metrics
type MetricsAggregation struct {
	ResourceID   string                 `json:"resourceId"`
	ResourceName string                 `json:"resourceName"`
	ResourceType string                 `json:"resourceType"`
	Provider     string                 `json:"provider"`
	Metrics      map[string]MetricStats `json:"metrics"`
	LastUpdated  time.Time              `json:"lastUpdated"`
	Status       string                 `json:"status"`
}

// MetricStats represents statistical information about a metric
type MetricStats struct {
	Current    float64   `json:"current"`
	Average    float64   `json:"average"`
	Min        float64   `json:"min"`
	Max        float64   `json:"max"`
	Trend      string    `json:"trend"` // "up", "down", "stable"
	LastUpdate time.Time `json:"lastUpdate"`
}

// DashboardMetrics represents metrics for dashboard display
type DashboardMetrics struct {
	TotalResources     int               `json:"totalResources"`
	RunningResources   int               `json:"runningResources"`
	StoppedResources   int               `json:"stoppedResources"`
	ErrorResources     int               `json:"errorResources"`
	TotalCost          float64           `json:"totalCost"`
	AverageCPUUsage    float64           `json:"averageCpuUsage"`
	AverageMemoryUsage float64           `json:"averageMemoryUsage"`
	ResourceBreakdown  map[string]int    `json:"resourceBreakdown"`
	ProviderBreakdown  map[string]int    `json:"providerBreakdown"`
	TopResources       []ResourceMetrics `json:"topResources"`
	RecentAlerts       []AlertSummary    `json:"recentAlerts"`
}

// ResourceMetrics represents metrics for a specific resource
type ResourceMetrics struct {
	ResourceID   string    `json:"resourceId"`
	ResourceName string    `json:"resourceName"`
	ResourceType string    `json:"resourceType"`
	Provider     string    `json:"provider"`
	Status       string    `json:"status"`
	CPUUsage     float64   `json:"cpuUsage"`
	MemoryUsage  float64   `json:"memoryUsage"`
	NetworkIn    float64   `json:"networkIn"`
	NetworkOut   float64   `json:"networkOut"`
	Cost         float64   `json:"cost"`
	LastUpdated  time.Time `json:"lastUpdated"`
}

// AlertSummary represents a summary of an alert (defined in alert_service.go)

// CollectMetrics collects metrics from all infrastructure resources
func (s *MetricsService) CollectMetrics(ctx context.Context, orgID string) error {
	// Get all infrastructure for the organization
	infrastructures, err := s.repoManager.Infrastructure.List(ctx, orgID, repositories.ListParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		return fmt.Errorf("failed to get infrastructure: %w", err)
	}

	// Collect metrics for each resource
	for _, infra := range infrastructures {
		if infra.ExternalID == nil {
			continue
		}

		provider, exists := s.providers[infra.Provider]
		if !exists {
			continue
		}

		// Get metrics from cloud provider
		metrics, err := provider.GetResourceMetrics(ctx, *infra.ExternalID)
		if err != nil {
			// Log error but continue with other resources
			fmt.Printf("Failed to get metrics for resource %s: %v\n", infra.ID, err)
			continue
		}

		// Store metrics in database
		if err := s.storeMetrics(ctx, infra.ID, infra.Type, metrics); err != nil {
			fmt.Printf("Failed to store metrics for resource %s: %v\n", infra.ID, err)
			continue
		}

		// Check for alerts based on metrics
		s.checkMetricsAlerts(ctx, infra, metrics)
	}

	return nil
}

// GetResourceMetrics retrieves metrics for a specific resource
func (s *MetricsService) GetResourceMetrics(ctx context.Context, resourceID string, duration time.Duration) ([]MetricData, error) {
	// Get metrics from database for the specified duration
	endTime := time.Now()
	startTime := endTime.Add(-duration)

	// Use Query method instead of GetByResourceIDAndTimeRange
	query := models.MetricQuery{
		ResourceID: &resourceID,
		StartTime:  &startTime,
		EndTime:    &endTime,
	}
	metrics, err := s.repoManager.Metric.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get metrics from database: %w", err)
	}

	// Convert to MetricData format
	var metricData []MetricData
	for _, metric := range metrics {
		metricData = append(metricData, MetricData{
			ID:           metric.ID,
			ResourceID:   *metric.ResourceID,
			ResourceType: metric.ResourceType,
			MetricName:   metric.MetricName,
			Value:        metric.Value,
			Unit:         metric.Unit,
			Timestamp:    metric.Timestamp,
			Tags:         s.parseTagsFromMap(metric.Tags),
			Metadata:     make(map[string]interface{}),
		})
	}

	return metricData, nil
}

// GetAggregatedMetrics retrieves aggregated metrics for an organization
func (s *MetricsService) GetAggregatedMetrics(ctx context.Context, orgID string) ([]MetricsAggregation, error) {
	// TODO: Implement when metric repository methods are available
	return []MetricsAggregation{}, nil
}

// GetDashboardMetrics retrieves metrics for dashboard display
func (s *MetricsService) GetDashboardMetrics(ctx context.Context, orgID string) (*DashboardMetrics, error) {
	// Get all infrastructure for the organization
	infrastructures, err := s.repoManager.Infrastructure.List(ctx, orgID, repositories.ListParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get infrastructure: %w", err)
	}

	dashboard := &DashboardMetrics{
		TotalResources:     len(infrastructures),
		RunningResources:   0,
		StoppedResources:   0,
		ErrorResources:     0,
		TotalCost:          0,
		AverageCPUUsage:    0,
		AverageMemoryUsage: 0,
		ResourceBreakdown:  make(map[string]int),
		ProviderBreakdown:  make(map[string]int),
		TopResources:       []ResourceMetrics{},
		RecentAlerts:       []AlertSummary{},
	}

	var totalCPU, totalMemory float64
	var resourceCount int

	for _, infra := range infrastructures {
		// Count resources by status
		switch infra.Status {
		case models.InfraStatusRunning:
			dashboard.RunningResources++
		case models.InfraStatusStopped:
			dashboard.StoppedResources++
		case models.InfraStatusError:
			dashboard.ErrorResources++
		}

		// Count resources by type and provider
		dashboard.ResourceBreakdown[infra.Type]++
		dashboard.ProviderBreakdown[infra.Provider]++

		// Get metrics for this resource
		if infra.ExternalID != nil {
			provider, exists := s.providers[infra.Provider]
			if exists {
				metrics, err := provider.GetResourceMetrics(ctx, *infra.ExternalID)
				if err == nil {
					// Calculate cost
					if costInfo, ok := infra.CostInfo["monthly_cost"].(float64); ok {
						dashboard.TotalCost += costInfo
					}

					// Calculate average CPU and memory usage
					if cpu, ok := metrics["cpu_utilization"].(float64); ok {
						totalCPU += cpu
						resourceCount++
					}
					if mem, ok := metrics["memory_utilization"].(float64); ok {
						totalMemory += mem
					}

					// Create resource metrics for top resources
					resourceMetrics := ResourceMetrics{
						ResourceID:   infra.ID,
						ResourceName: infra.Name,
						ResourceType: infra.Type,
						Provider:     infra.Provider,
						Status:       infra.Status,
						LastUpdated:  time.Now(),
					}

					if cpu, ok := metrics["cpu_utilization"].(float64); ok {
						resourceMetrics.CPUUsage = cpu
					}
					if mem, ok := metrics["memory_utilization"].(float64); ok {
						resourceMetrics.MemoryUsage = mem
					}
					if netIn, ok := metrics["network_in"].(float64); ok {
						resourceMetrics.NetworkIn = netIn
					}
					if netOut, ok := metrics["network_out"].(float64); ok {
						resourceMetrics.NetworkOut = netOut
					}
					if costInfo, ok := infra.CostInfo["monthly_cost"].(float64); ok {
						resourceMetrics.Cost = costInfo
					}

					dashboard.TopResources = append(dashboard.TopResources, resourceMetrics)
				}
			}
		}
	}

	// Calculate averages
	if resourceCount > 0 {
		dashboard.AverageCPUUsage = totalCPU / float64(resourceCount)
		dashboard.AverageMemoryUsage = totalMemory / float64(resourceCount)
	}

	// Get recent alerts - TODO: Implement when alert repository methods are available
	// alerts, err := s.repoManager.Alert.GetRecentByOrganization(ctx, orgID, 10)
	// if err == nil {
	// 	for _, alert := range alerts {
	// 		dashboard.RecentAlerts = append(dashboard.RecentAlerts, AlertSummary{
	// 			ID:         alert.ID,
	// 			Type:       alert.Type,
	// 			Severity:   alert.Severity,
	// 			Message:    alert.Message,
	// 			ResourceID: *alert.ResourceID,
	// 			Timestamp:  alert.CreatedAt,
	// 			Status:     alert.Status,
	// 		})
	// 	}
	// }

	return dashboard, nil
}

// CreateCustomMetric creates a custom metric definition
func (s *MetricsService) CreateCustomMetric(ctx context.Context, orgID string, metric *models.Metric) error {
	// TODO: Implement when metric model is updated
	return fmt.Errorf("not implemented")
}

// GetMetricDefinitions retrieves custom metric definitions for an organization
func (s *MetricsService) GetMetricDefinitions(ctx context.Context, orgID string) ([]models.Metric, error) {
	// TODO: Implement when metric repository methods are available
	return []models.Metric{}, nil
}

// Helper functions
func (s *MetricsService) storeMetrics(ctx context.Context, resourceID, resourceType string, metrics map[string]interface{}) error {
	timestamp := time.Now()

	for metricName, value := range metrics {
		// Convert value to float64
		var floatValue float64
		switch v := value.(type) {
		case float64:
			floatValue = v
		case int:
			floatValue = float64(v)
		case int64:
			floatValue = float64(v)
		default:
			continue // Skip non-numeric values
		}

		// Determine unit based on metric name
		unit := "count"
		switch metricName {
		case "cpu_utilization", "memory_utilization":
			unit = "percent"
		case "network_in", "network_out":
			unit = "bytes"
		case "disk_read_ops", "disk_write_ops":
			unit = "operations"
		}

		metric := &models.Metric{
			ID:           fmt.Sprintf("%s-%s-%d", resourceID, metricName, timestamp.Unix()),
			ResourceID:   &resourceID,
			ResourceType: resourceType,
			MetricName:   metricName,
			Value:        floatValue,
			Unit:         unit,
			Timestamp:    timestamp,
		}

		if err := s.repoManager.Metric.Create(ctx, metric); err != nil {
			return fmt.Errorf("failed to store metric %s: %w", metricName, err)
		}
	}

	return nil
}

func (s *MetricsService) checkMetricsAlerts(ctx context.Context, infra *models.Infrastructure, metrics map[string]interface{}) {
	// Check CPU utilization
	if cpu, ok := metrics["cpu_utilization"].(float64); ok {
		if cpu > 90 {
			s.alertService.CreateAlert(ctx, &models.Alert{
				Type:       "high_cpu_usage",
				Severity:   "warning",
				Message:    fmt.Sprintf("High CPU usage detected: %.1f%%", cpu),
				ResourceID: &infra.ID,
			})
		}
	}

	// Check memory utilization
	if mem, ok := metrics["memory_utilization"].(float64); ok {
		if mem > 90 {
			s.alertService.CreateAlert(ctx, &models.Alert{
				Type:       "high_memory_usage",
				Severity:   "warning",
				Message:    fmt.Sprintf("High memory usage detected: %.1f%%", mem),
				ResourceID: &infra.ID,
			})
		}
	}

	// Check for resource errors
	if infra.Status == models.InfraStatusError {
		s.alertService.CreateAlert(ctx, &models.Alert{
			Type:       "resource_error",
			Severity:   "critical",
			Message:    fmt.Sprintf("Resource %s is in error state", infra.Name),
			ResourceID: &infra.ID,
		})
	}
}

func (s *MetricsService) parseTags(tags []string) map[string]string {
	result := make(map[string]string)
	for _, tag := range tags {
		// Assume tags are in format "key=value"
		// For simplicity, we'll just use the tag as both key and value
		result[tag] = tag
	}
	return result
}

func (s *MetricsService) parseTagsFromMap(tags map[string]interface{}) map[string]string {
	result := make(map[string]string)
	for key, value := range tags {
		if strValue, ok := value.(string); ok {
			result[key] = strValue
		} else {
			result[key] = fmt.Sprintf("%v", value)
		}
	}
	return result
}
