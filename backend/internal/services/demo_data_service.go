package services

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"

	"github.com/google/uuid"
)

type DemoDataService struct {
	userRepo         repositories.UserRepositoryInterface
	infraRepo        repositories.InfrastructureRepositoryInterface
	deploymentRepo   repositories.DeploymentRepositoryInterface
	metricRepo       repositories.MetricRepositoryInterface
	alertRepo        repositories.AlertRepositoryInterface
	demoDataRepo     *repositories.DemoDataRepository
}

func NewDemoDataService(
	userRepo repositories.UserRepositoryInterface,
	infraRepo repositories.InfrastructureRepositoryInterface,
	deploymentRepo repositories.DeploymentRepositoryInterface,
	metricRepo repositories.MetricRepositoryInterface,
	alertRepo repositories.AlertRepositoryInterface,
	demoDataRepo *repositories.DemoDataRepository,
) *DemoDataService {
	return &DemoDataService{
		userRepo:       userRepo,
		infraRepo:      infraRepo,
		deploymentRepo: deploymentRepo,
		metricRepo:     metricRepo,
		alertRepo:      alertRepo,
		demoDataRepo:   demoDataRepo,
	}
}

// InitializeDemoData creates demo data for a user based on the specified scenario
func (s *DemoDataService) InitializeDemoData(ctx context.Context, userID string, scenario models.DemoScenario) error {
	// Clear any existing demo data
	if err := s.ClearDemoData(ctx, userID); err != nil {
		return fmt.Errorf("failed to clear existing demo data: %w", err)
	}

	// Generate demo data based on scenario
	demoDataSet, err := s.generateDemoDataSet(userID, scenario)
	if err != nil {
		return fmt.Errorf("failed to generate demo data: %w", err)
	}

	// Store demo data in database
	if err := s.storeDemoDataSet(ctx, demoDataSet); err != nil {
		return fmt.Errorf("failed to store demo data: %w", err)
	}

	// Update user's demo mode and scenario
	if err := s.userRepo.UpdateDemoSettings(ctx, userID, true, string(scenario)); err != nil {
		return fmt.Errorf("failed to update user demo settings: %w", err)
	}

	return nil
}

// GetDemoData retrieves demo data for a user
func (s *DemoDataService) GetDemoData(ctx context.Context, userID string, dataType string) (interface{}, error) {
	demoData, err := s.demoDataRepo.GetByUserAndType(ctx, userID, dataType)
	if err != nil {
		return nil, fmt.Errorf("failed to get demo data: %w", err)
	}

	return demoData.Data, nil
}

// GetDemoInfrastructure retrieves demo infrastructure data
func (s *DemoDataService) GetDemoInfrastructure(ctx context.Context, userID string) ([]*models.DemoInfrastructure, error) {
	data, err := s.GetDemoData(ctx, userID, "infrastructure")
	if err != nil {
		return nil, err
	}

	var infrastructure []*models.DemoInfrastructure
	if err := s.unmarshalData(data, &infrastructure); err != nil {
		return nil, fmt.Errorf("failed to unmarshal infrastructure data: %w", err)
	}

	return infrastructure, nil
}

// GetDemoDeployments retrieves demo deployment data
func (s *DemoDataService) GetDemoDeployments(ctx context.Context, userID string) ([]*models.DemoDeployment, error) {
	data, err := s.GetDemoData(ctx, userID, "deployments")
	if err != nil {
		return nil, err
	}

	var deployments []*models.DemoDeployment
	if err := s.unmarshalData(data, &deployments); err != nil {
		return nil, fmt.Errorf("failed to unmarshal deployment data: %w", err)
	}

	return deployments, nil
}

// GetDemoMetrics retrieves demo metrics data
func (s *DemoDataService) GetDemoMetrics(ctx context.Context, userID string, timeRange TimeRange) ([]*models.DemoMetric, error) {
	data, err := s.GetDemoData(ctx, userID, "metrics")
	if err != nil {
		return nil, err
	}

	var metrics []*models.DemoMetric
	if err := s.unmarshalData(data, &metrics); err != nil {
		return nil, fmt.Errorf("failed to unmarshal metrics data: %w", err)
	}

	// Filter metrics by time range if specified
	if !timeRange.Start.IsZero() || !timeRange.End.IsZero() {
		filtered := make([]*models.DemoMetric, 0)
		for _, metric := range metrics {
			if (timeRange.Start.IsZero() || metric.Timestamp.After(timeRange.Start)) &&
				(timeRange.End.IsZero() || metric.Timestamp.Before(timeRange.End)) {
				filtered = append(filtered, metric)
			}
		}
		metrics = filtered
	}

	return metrics, nil
}

// GetDemoAlerts retrieves demo alert data
func (s *DemoDataService) GetDemoAlerts(ctx context.Context, userID string) ([]*models.DemoAlert, error) {
	data, err := s.GetDemoData(ctx, userID, "alerts")
	if err != nil {
		return nil, err
	}

	var alerts []*models.DemoAlert
	if err := s.unmarshalData(data, &alerts); err != nil {
		return nil, fmt.Errorf("failed to unmarshal alert data: %w", err)
	}

	return alerts, nil
}

// GetDemoCostData retrieves demo cost data
func (s *DemoDataService) GetDemoCostData(ctx context.Context, userID string) (*models.DemoCostData, error) {
	data, err := s.GetDemoData(ctx, userID, "cost")
	if err != nil {
		return nil, err
	}

	var costData *models.DemoCostData
	if err := s.unmarshalData(data, &costData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal cost data: %w", err)
	}

	return costData, nil
}

// ClearDemoData removes all demo data for a user
func (s *DemoDataService) ClearDemoData(ctx context.Context, userID string) error {
	if err := s.demoDataRepo.DeleteByUser(ctx, userID); err != nil {
		return fmt.Errorf("failed to delete demo data: %w", err)
	}

	// Update user's demo mode
	if err := s.userRepo.UpdateDemoSettings(ctx, userID, false, ""); err != nil {
		return fmt.Errorf("failed to update user demo settings: %w", err)
	}

	return nil
}

// TransitionToReal transitions a user from demo mode to real data
func (s *DemoDataService) TransitionToReal(ctx context.Context, userID string, keepSettings bool) error {
	// Clear demo data
	if err := s.ClearDemoData(ctx, userID); err != nil {
		return fmt.Errorf("failed to clear demo data: %w", err)
	}

	// If not keeping settings, reset user preferences to defaults
	if !keepSettings {
		defaultPrefs := map[string]interface{}{
			"theme":    "system",
			"language": "en",
			"timezone": "UTC",
		}
		if err := s.userRepo.UpdatePreferences(ctx, userID, defaultPrefs); err != nil {
			return fmt.Errorf("failed to reset user preferences: %w", err)
		}
	}

	return nil
}

// generateDemoDataSet generates a complete demo data set based on scenario
func (s *DemoDataService) generateDemoDataSet(userID string, scenario models.DemoScenario) (*models.DemoDataSet, error) {
	now := time.Now()
	expiresAt := now.Add(30 * 24 * time.Hour) // Demo data expires in 30 days

	dataSet := &models.DemoDataSet{
		UserID:      userID,
		Scenario:    scenario,
		GeneratedAt: now,
		ExpiresAt:   &expiresAt,
	}

	switch scenario {
	case models.DemoScenarioStartup:
		dataSet.Infrastructure = s.generateStartupInfrastructure(userID)
		dataSet.Deployments = s.generateStartupDeployments(userID)
		dataSet.Metrics = s.generateStartupMetrics(userID)
		dataSet.Alerts = s.generateStartupAlerts(userID)
		dataSet.CostData = s.generateStartupCostData()
	case models.DemoScenarioEnterprise:
		dataSet.Infrastructure = s.generateEnterpriseInfrastructure(userID)
		dataSet.Deployments = s.generateEnterpriseDeployments(userID)
		dataSet.Metrics = s.generateEnterpriseMetrics(userID)
		dataSet.Alerts = s.generateEnterpriseAlerts(userID)
		dataSet.CostData = s.generateEnterpriseCostData()
	case models.DemoScenarioDevOps:
		dataSet.Infrastructure = s.generateDevOpsInfrastructure(userID)
		dataSet.Deployments = s.generateDevOpsDeployments(userID)
		dataSet.Metrics = s.generateDevOpsMetrics(userID)
		dataSet.Alerts = s.generateDevOpsAlerts(userID)
		dataSet.CostData = s.generateDevOpsCostData()
	case models.DemoScenarioMultiCloud:
		dataSet.Infrastructure = s.generateMultiCloudInfrastructure(userID)
		dataSet.Deployments = s.generateMultiCloudDeployments(userID)
		dataSet.Metrics = s.generateMultiCloudMetrics(userID)
		dataSet.Alerts = s.generateMultiCloudAlerts(userID)
		dataSet.CostData = s.generateMultiCloudCostData()
	default:
		return nil, fmt.Errorf("unknown demo scenario: %s", scenario)
	}

	return dataSet, nil
}

// storeDemoDataSet stores a demo data set in the database
func (s *DemoDataService) storeDemoDataSet(ctx context.Context, dataSet *models.DemoDataSet) error {
	// Store infrastructure data
	if err := s.storeDemoData(ctx, dataSet.UserID, dataSet.Scenario, "infrastructure", dataSet.Infrastructure, dataSet.ExpiresAt); err != nil {
		return err
	}

	// Store deployment data
	if err := s.storeDemoData(ctx, dataSet.UserID, dataSet.Scenario, "deployments", dataSet.Deployments, dataSet.ExpiresAt); err != nil {
		return err
	}

	// Store metrics data
	if err := s.storeDemoData(ctx, dataSet.UserID, dataSet.Scenario, "metrics", dataSet.Metrics, dataSet.ExpiresAt); err != nil {
		return err
	}

	// Store alerts data
	if err := s.storeDemoData(ctx, dataSet.UserID, dataSet.Scenario, "alerts", dataSet.Alerts, dataSet.ExpiresAt); err != nil {
		return err
	}

	// Store cost data
	if err := s.storeDemoData(ctx, dataSet.UserID, dataSet.Scenario, "cost", dataSet.CostData, dataSet.ExpiresAt); err != nil {
		return err
	}

	return nil
}

// storeDemoData stores a single type of demo data
func (s *DemoDataService) storeDemoData(ctx context.Context, userID string, scenario models.DemoScenario, dataType string, data interface{}, expiresAt *time.Time) error {
	demoData := &models.DemoData{
		ID:          uuid.New().String(),
		UserID:      userID,
		Scenario:    scenario,
		DataType:    dataType,
		Data:        data,
		GeneratedAt: time.Now(),
		ExpiresAt:   expiresAt,
	}

	return s.demoDataRepo.Create(ctx, demoData)
}

// unmarshalData unmarshals JSON data into the target interface
func (s *DemoDataService) unmarshalData(data interface{}, target interface{}) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return json.Unmarshal(jsonData, target)
}

// TimeRange represents a time range for filtering data
type TimeRange struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// Demo data generators for different scenarios

// generateStartupInfrastructure generates infrastructure data for startup scenario
func (s *DemoDataService) generateStartupInfrastructure(userID string) []*models.DemoInfrastructure {
	now := time.Now()
	orgID := uuid.New().String() // Demo org ID

	infrastructure := []*models.DemoInfrastructure{
		{
			Infrastructure: &models.Infrastructure{
				ID:             uuid.New().String(),
				OrganizationID: orgID,
				Name:           "demo-web-server-1",
				Type:           "server",
				Provider:       "aws",
				Region:         "us-east-1",
				Status:         "running",
				Specifications: map[string]interface{}{
					"instanceType": "t3.micro",
					"cpu":          1,
					"memory":       1,
					"storage":      8,
				},
				CostInfo: map[string]interface{}{
					"hourlyRate":   0.0104,
					"monthlyRate":  7.59,
				},
				Tags:       []string{"web", "frontend", "demo"},
				ExternalID: &[]string{"i-1234567890abcdef0"}[0],
				CreatedAt:  now.Add(-72 * time.Hour),
				UpdatedAt:  now.Add(-1 * time.Hour),
			},
			DemoMetadata: models.DemoMetadata{
				IsDemo:      true,
				Scenario:    models.DemoScenarioStartup,
				Realistic:   true,
				Tags:        []string{"startup", "web-server"},
				Description: "Demo web server for startup scenario",
			},
		},
		{
			Infrastructure: &models.Infrastructure{
				ID:             uuid.New().String(),
				OrganizationID: orgID,
				Name:           "demo-database-1",
				Type:           "database",
				Provider:       "aws",
				Region:         "us-east-1",
				Status:         "running",
				Specifications: map[string]interface{}{
					"engine":       "postgresql",
					"version":      "13.7",
					"instanceType": "db.t3.micro",
					"storage":      20,
				},
				CostInfo: map[string]interface{}{
					"hourlyRate":   0.017,
					"monthlyRate":  12.41,
				},
				Tags:       []string{"database", "postgresql", "demo"},
				ExternalID: &[]string{"demo-db-instance-1"}[0],
				CreatedAt:  now.Add(-48 * time.Hour),
				UpdatedAt:  now.Add(-2 * time.Hour),
			},
			DemoMetadata: models.DemoMetadata{
				IsDemo:      true,
				Scenario:    models.DemoScenarioStartup,
				Realistic:   true,
				Tags:        []string{"startup", "database"},
				Description: "Demo PostgreSQL database for startup scenario",
			},
		},
	}

	return infrastructure
}

// generateStartupDeployments generates deployment data for startup scenario
func (s *DemoDataService) generateStartupDeployments(userID string) []*models.DemoDeployment {
	now := time.Now()
	orgID := uuid.New().String()

	deployments := []*models.DemoDeployment{
		{
			Deployment: &models.Deployment{
				ID:             uuid.New().String(),
				OrganizationID: orgID,
				Name:           "demo-web-app-v1.2.0",
				Application:    "web-app",
				Version:        "1.2.0",
				Environment:    "production",
				Status:         "completed",
				Progress:       100,
				Configuration: map[string]interface{}{
					"replicas":     2,
					"cpu":          "100m",
					"memory":       "128Mi",
					"healthCheck":  "/health",
				},
				StartedAt:   func() *time.Time { t := now.Add(-6 * time.Hour); return &t }(),
				CompletedAt: func() *time.Time { t := now.Add(-5*time.Hour - 30*time.Minute); return &t }(),
				CreatedBy:   &userID,
				CreatedAt:   now.Add(-6 * time.Hour),
				UpdatedAt:   now.Add(-5*time.Hour - 30*time.Minute),
			},
			DemoMetadata: models.DemoMetadata{
				IsDemo:      true,
				Scenario:    models.DemoScenarioStartup,
				Realistic:   true,
				Tags:        []string{"startup", "web-app", "production"},
				Description: "Demo web application deployment",
			},
		},
		{
			Deployment: &models.Deployment{
				ID:             uuid.New().String(),
				OrganizationID: orgID,
				Name:           "demo-api-v2.1.1",
				Application:    "api-service",
				Version:        "2.1.1",
				Environment:    "staging",
				Status:         "running",
				Progress:       85,
				Configuration: map[string]interface{}{
					"replicas":     1,
					"cpu":          "200m",
					"memory":       "256Mi",
					"healthCheck":  "/api/health",
				},
				StartedAt: func() *time.Time { t := now.Add(-2 * time.Hour); return &t }(),
				CreatedBy: &userID,
				CreatedAt: now.Add(-2 * time.Hour),
				UpdatedAt: now.Add(-15 * time.Minute),
			},
			DemoMetadata: models.DemoMetadata{
				IsDemo:      true,
				Scenario:    models.DemoScenarioStartup,
				Realistic:   true,
				Tags:        []string{"startup", "api", "staging"},
				Description: "Demo API service deployment in staging",
			},
		},
	}

	return deployments
}

// generateStartupMetrics generates metrics data for startup scenario
func (s *DemoDataService) generateStartupMetrics(userID string) []*models.DemoMetric {
	now := time.Now()
	metrics := make([]*models.DemoMetric, 0)

	// Generate CPU metrics for the last 24 hours
	for i := 0; i < 24; i++ {
		timestamp := now.Add(-time.Duration(i) * time.Hour)
		cpuValue := 15.0 + rand.Float64()*20.0 // 15-35% CPU usage

		metrics = append(metrics, &models.DemoMetric{
			Metric: &models.Metric{
				ID:           uuid.New().String(),
				ResourceID:   &[]string{"demo-web-server-1"}[0],
				ResourceType: "server",
				MetricName:   "cpu_utilization",
				Value:        cpuValue,
				Unit:         "percent",
				Tags: map[string]interface{}{
					"instance": "demo-web-server-1",
					"region":   "us-east-1",
				},
				Timestamp: timestamp,
				CreatedAt: timestamp,
			},
			DemoMetadata: models.DemoMetadata{
				IsDemo:      true,
				Scenario:    models.DemoScenarioStartup,
				Realistic:   true,
				Tags:        []string{"startup", "cpu", "monitoring"},
				Description: "Demo CPU utilization metrics",
			},
		})

		// Memory metrics
		memoryValue := 45.0 + rand.Float64()*25.0 // 45-70% memory usage
		metrics = append(metrics, &models.DemoMetric{
			Metric: &models.Metric{
				ID:           uuid.New().String(),
				ResourceID:   &[]string{"demo-web-server-1"}[0],
				ResourceType: "server",
				MetricName:   "memory_utilization",
				Value:        memoryValue,
				Unit:         "percent",
				Tags: map[string]interface{}{
					"instance": "demo-web-server-1",
					"region":   "us-east-1",
				},
				Timestamp: timestamp,
				CreatedAt: timestamp,
			},
			DemoMetadata: models.DemoMetadata{
				IsDemo:      true,
				Scenario:    models.DemoScenarioStartup,
				Realistic:   true,
				Tags:        []string{"startup", "memory", "monitoring"},
				Description: "Demo memory utilization metrics",
			},
		})
	}

	return metrics
}

// generateStartupAlerts generates alert data for startup scenario
func (s *DemoDataService) generateStartupAlerts(userID string) []*models.DemoAlert {
	now := time.Now()
	orgID := uuid.New().String()

	alerts := []*models.DemoAlert{
		{
			Alert: &models.Alert{
				ID:             uuid.New().String(),
				OrganizationID: orgID,
				Type:           "performance",
				Severity:       "warning",
				Title:          "High Memory Usage",
				Message:        "Memory usage on demo-web-server-1 has exceeded 80% for the last 15 minutes",
				ResourceID:     func() *string { s := "demo-web-server-1"; return &s }(),
				ResourceType:   func() *string { s := "server"; return &s }(),
				Acknowledged:   false,
				CreatedAt:      now.Add(-2 * time.Hour),
				UpdatedAt:      now.Add(-2 * time.Hour),
			},
			DemoMetadata: models.DemoMetadata{
				IsDemo:      true,
				Scenario:    models.DemoScenarioStartup,
				Realistic:   true,
				Tags:        []string{"startup", "performance", "memory"},
				Description: "Demo high memory usage alert",
			},
		},
		{
			Alert: &models.Alert{
				ID:             uuid.New().String(),
				OrganizationID: orgID,
				Type:           "security",
				Severity:       "info",
				Title:          "Security Scan Completed",
				Message:        "Weekly security scan completed successfully. No critical vulnerabilities found.",
				Acknowledged:   true,
				AcknowledgedBy: &userID,
				AcknowledgedAt: func() *time.Time { t := now.Add(-1 * time.Hour); return &t }(),
				CreatedAt:      now.Add(-24 * time.Hour),
				UpdatedAt:      now.Add(-1 * time.Hour),
			},
			DemoMetadata: models.DemoMetadata{
				IsDemo:      true,
				Scenario:    models.DemoScenarioStartup,
				Realistic:   true,
				Tags:        []string{"startup", "security", "scan"},
				Description: "Demo security scan completion alert",
			},
		},
	}

	return alerts
}

// generateStartupCostData generates cost data for startup scenario
func (s *DemoDataService) generateStartupCostData() *models.DemoCostData {
	now := time.Now()
	
	// Generate cost trend for the last 30 days
	trend := make([]models.CostDataPoint, 30)
	for i := 0; i < 30; i++ {
		date := now.AddDate(0, 0, -29+i)
		baseCost := 25.0
		variation := rand.Float64()*10.0 - 5.0 // ±5 variation
		trend[i] = models.CostDataPoint{
			Date:   date,
			Amount: baseCost + variation,
		}
	}

	// Generate forecast for next 30 days
	forecast := make([]models.CostDataPoint, 30)
	for i := 0; i < 30; i++ {
		date := now.AddDate(0, 0, i+1)
		baseCost := 28.0 // Slight increase in forecast
		variation := rand.Float64()*8.0 - 4.0 // ±4 variation
		forecast[i] = models.CostDataPoint{
			Date:   date,
			Amount: baseCost + variation,
		}
	}

	return &models.DemoCostData{
		TotalCost: 742.50,
		Currency:  "USD",
		Period:    "monthly",
		ByService: map[string]float64{
			"EC2":      420.30,
			"RDS":      186.75,
			"S3":       45.20,
			"CloudWatch": 25.15,
			"Route53":  15.10,
			"Other":    50.00,
		},
		ByRegion: map[string]float64{
			"us-east-1": 650.25,
			"us-west-2": 92.25,
		},
		Trend:    trend,
		Forecast: forecast,
		Recommendations: []models.CostOptimizationTip{
			{
				Type:        "rightsizing",
				Title:       "Rightsize EC2 Instances",
				Description: "Your t3.micro instances are underutilized. Consider switching to t3.nano to save costs.",
				Savings:     45.30,
				Priority:    "medium",
			},
			{
				Type:        "storage",
				Title:       "Optimize S3 Storage Class",
				Description: "Move infrequently accessed data to S3 Intelligent-Tiering to reduce storage costs.",
				Savings:     12.50,
				Priority:    "low",
			},
		},
		DemoMetadata: models.DemoMetadata{
			IsDemo:      true,
			Scenario:    models.DemoScenarioStartup,
			Realistic:   true,
			Tags:        []string{"startup", "cost", "optimization"},
			Description: "Demo cost data for startup scenario",
		},
	}
}

// Enterprise scenario generators (simplified versions)
func (s *DemoDataService) generateEnterpriseInfrastructure(userID string) []*models.DemoInfrastructure {
	// Generate more complex enterprise infrastructure
	// This would include multiple regions, load balancers, auto-scaling groups, etc.
	// For brevity, returning a simplified version
	return s.generateStartupInfrastructure(userID) // Placeholder
}

func (s *DemoDataService) generateEnterpriseDeployments(userID string) []*models.DemoDeployment {
	return s.generateStartupDeployments(userID) // Placeholder
}

func (s *DemoDataService) generateEnterpriseMetrics(userID string) []*models.DemoMetric {
	return s.generateStartupMetrics(userID) // Placeholder
}

func (s *DemoDataService) generateEnterpriseAlerts(userID string) []*models.DemoAlert {
	return s.generateStartupAlerts(userID) // Placeholder
}

func (s *DemoDataService) generateEnterpriseCostData() *models.DemoCostData {
	costData := s.generateStartupCostData()
	costData.TotalCost = 15420.75 // Much higher enterprise costs
	costData.DemoMetadata.Scenario = models.DemoScenarioEnterprise
	return costData
}

// DevOps scenario generators (placeholders)
func (s *DemoDataService) generateDevOpsInfrastructure(userID string) []*models.DemoInfrastructure {
	return s.generateStartupInfrastructure(userID) // Placeholder
}

func (s *DemoDataService) generateDevOpsDeployments(userID string) []*models.DemoDeployment {
	return s.generateStartupDeployments(userID) // Placeholder
}

func (s *DemoDataService) generateDevOpsMetrics(userID string) []*models.DemoMetric {
	return s.generateStartupMetrics(userID) // Placeholder
}

func (s *DemoDataService) generateDevOpsAlerts(userID string) []*models.DemoAlert {
	return s.generateStartupAlerts(userID) // Placeholder
}

func (s *DemoDataService) generateDevOpsCostData() *models.DemoCostData {
	costData := s.generateStartupCostData()
	costData.TotalCost = 3250.40
	costData.DemoMetadata.Scenario = models.DemoScenarioDevOps
	return costData
}

// MultiCloud scenario generators (placeholders)
func (s *DemoDataService) generateMultiCloudInfrastructure(userID string) []*models.DemoInfrastructure {
	return s.generateStartupInfrastructure(userID) // Placeholder
}

func (s *DemoDataService) generateMultiCloudDeployments(userID string) []*models.DemoDeployment {
	return s.generateStartupDeployments(userID) // Placeholder
}

func (s *DemoDataService) generateMultiCloudMetrics(userID string) []*models.DemoMetric {
	return s.generateStartupMetrics(userID) // Placeholder
}

func (s *DemoDataService) generateMultiCloudAlerts(userID string) []*models.DemoAlert {
	return s.generateStartupAlerts(userID) // Placeholder
}

func (s *DemoDataService) generateMultiCloudCostData() *models.DemoCostData {
	costData := s.generateStartupCostData()
	costData.TotalCost = 8750.25
	costData.DemoMetadata.Scenario = models.DemoScenarioMultiCloud
	return costData
}