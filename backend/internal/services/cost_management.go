package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"cloudweave/internal/repositories"
)

// CostManagementService handles cost tracking, allocation, and optimization
type CostManagementService struct {
	repoManager *repositories.RepositoryManager
	providers   map[string]CloudProvider
}

// NewCostManagementService creates a new cost management service
func NewCostManagementService(repoManager *repositories.RepositoryManager, providers map[string]CloudProvider) *CostManagementService {
	return &CostManagementService{
		repoManager: repoManager,
		providers:   providers,
	}
}

// CostBreakdown represents detailed cost information
type CostBreakdown struct {
	TotalCost       float64                 `json:"totalCost"`
	Currency        string                  `json:"currency"`
	Period          string                  `json:"period"`
	Breakdown       map[string]ResourceCost `json:"breakdown"`
	Trends          []CostTrend             `json:"trends"`
	Recommendations []CostRecommendation    `json:"recommendations"`
}

// ResourceCost represents cost for a specific resource
type ResourceCost struct {
	ResourceID   string            `json:"resourceId"`
	ResourceName string            `json:"resourceName"`
	ResourceType string            `json:"resourceType"`
	Provider     string            `json:"provider"`
	HourlyCost   float64           `json:"hourlyCost"`
	DailyCost    float64           `json:"dailyCost"`
	MonthlyCost  float64           `json:"monthlyCost"`
	Tags         map[string]string `json:"tags"`
	Usage        ResourceUsage     `json:"usage"`
}

// ResourceUsage represents resource utilization
type ResourceUsage struct {
	CPUUtilization    float64 `json:"cpuUtilization"`
	MemoryUtilization float64 `json:"memoryUtilization"`
	StorageUsage      float64 `json:"storageUsage"`
	NetworkUsage      float64 `json:"networkUsage"`
}

// CostTrend represents cost trends over time
type CostTrend struct {
	Date  time.Time `json:"date"`
	Cost  float64   `json:"cost"`
	Usage float64   `json:"usage"`
}

// CostRecommendation represents cost optimization recommendations
type CostRecommendation struct {
	Type             string  `json:"type"`
	Description      string  `json:"description"`
	PotentialSavings float64 `json:"potentialSavings"`
	Priority         string  `json:"priority"`
	Action           string  `json:"action"`
}

// GetCostBreakdown retrieves detailed cost breakdown for an organization
func (s *CostManagementService) GetCostBreakdown(ctx context.Context, orgID string, period string) (*CostBreakdown, error) {
	// Get all infrastructure for the organization
	infrastructures, err := s.repoManager.Infrastructure.List(ctx, orgID, repositories.ListParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get infrastructure: %w", err)
	}

	breakdown := &CostBreakdown{
		TotalCost:       0,
		Currency:        "USD",
		Period:          period,
		Breakdown:       make(map[string]ResourceCost),
		Trends:          []CostTrend{},
		Recommendations: []CostRecommendation{},
	}

	// Calculate costs for each resource
	for _, infra := range infrastructures {
		if infra.ExternalID == nil {
			continue
		}

		provider, exists := s.providers[infra.Provider]
		if !exists {
			continue
		}

		// Get resource details including cost information
		details, err := provider.GetResourceDetails(ctx, *infra.ExternalID)
		if err != nil {
			continue
		}

		// Get current metrics for usage calculation
		metrics, err := provider.GetResourceMetrics(ctx, *infra.ExternalID)
		if err != nil {
			metrics = map[string]interface{}{}
		}

		// Extract cost information
		costInfo, ok := details["costInfo"].(map[string]interface{})
		if !ok {
			continue
		}

		hourlyCost := 0.0
		if hc, ok := costInfo["hourly_cost"].(float64); ok {
			hourlyCost = hc
		}

		// Calculate usage metrics
		usage := ResourceUsage{}
		if cpu, ok := metrics["cpu_utilization"].(float64); ok {
			usage.CPUUtilization = cpu
		}
		if mem, ok := metrics["memory_utilization"].(float64); ok {
			usage.MemoryUtilization = mem
		}

		// Create resource cost entry
		resourceCost := ResourceCost{
			ResourceID:   infra.ID,
			ResourceName: infra.Name,
			ResourceType: infra.Type,
			Provider:     infra.Provider,
			HourlyCost:   hourlyCost,
			DailyCost:    hourlyCost * 24,
			MonthlyCost:  hourlyCost * 24 * 30,
			Tags:         s.convertTags(infra.Tags),
			Usage:        usage,
		}

		breakdown.Breakdown[infra.ID] = resourceCost
		breakdown.TotalCost += resourceCost.MonthlyCost
	}

	// Generate cost trends (last 30 days)
	breakdown.Trends = s.generateCostTrends(ctx, orgID, 30)

	// Generate cost optimization recommendations
	breakdown.Recommendations = s.generateRecommendations(breakdown.Breakdown)

	return breakdown, nil
}

// GetCostByTags retrieves cost breakdown by tags
func (s *CostManagementService) GetCostByTags(ctx context.Context, orgID string, tags map[string]string) (map[string]float64, error) {
	infrastructures, err := s.repoManager.Infrastructure.List(ctx, orgID, repositories.ListParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get infrastructure: %w", err)
	}

	costByTags := make(map[string]float64)

	for _, infra := range infrastructures {
		if infra.ExternalID == nil {
			continue
		}

		// Check if infrastructure matches the requested tags
		if !s.matchesTags(infra.Tags, tags) {
			continue
		}

		provider, exists := s.providers[infra.Provider]
		if !exists {
			continue
		}

		details, err := provider.GetResourceDetails(ctx, *infra.ExternalID)
		if err != nil {
			continue
		}

		costInfo, ok := details["costInfo"].(map[string]interface{})
		if !ok {
			continue
		}

		hourlyCost := 0.0
		if hc, ok := costInfo["hourly_cost"].(float64); ok {
			hourlyCost = hc
		}

		monthlyCost := hourlyCost * 24 * 30

		// Group by tag values
		for _, tag := range infra.Tags {
			costByTags[tag] += monthlyCost
		}
	}

	return costByTags, nil
}

// GetBudgetAlerts retrieves budget alerts for an organization
func (s *CostManagementService) GetBudgetAlerts(ctx context.Context, orgID string) ([]BudgetAlert, error) {
	// Get organization budget settings
	// This would typically come from a budget configuration table
	// For now, we'll use a default budget
	defaultBudget := 1000.0 // $1000 default monthly budget

	// Get current month's cost
	breakdown, err := s.GetCostBreakdown(ctx, orgID, "monthly")
	if err != nil {
		return nil, fmt.Errorf("failed to get cost breakdown: %w", err)
	}

	var alerts []BudgetAlert

	// Check if current cost exceeds budget
	if breakdown.TotalCost > defaultBudget {
		alerts = append(alerts, BudgetAlert{
			Type:        "budget_exceeded",
			Message:     fmt.Sprintf("Monthly budget of $%.2f exceeded. Current cost: $%.2f", defaultBudget, breakdown.TotalCost),
			Severity:    "high",
			CurrentCost: breakdown.TotalCost,
			Budget:      defaultBudget,
			Timestamp:   time.Now(),
		})
	}

	// Check for cost spikes (50% increase from previous period)
	// This would require historical data analysis
	if breakdown.TotalCost > defaultBudget*0.8 {
		alerts = append(alerts, BudgetAlert{
			Type:        "budget_warning",
			Message:     fmt.Sprintf("Approaching monthly budget limit. Current cost: $%.2f", breakdown.TotalCost),
			Severity:    "medium",
			CurrentCost: breakdown.TotalCost,
			Budget:      defaultBudget,
			Timestamp:   time.Now(),
		})
	}

	return alerts, nil
}

// GetCostForecast generates cost forecast for the next 30 days
func (s *CostManagementService) GetCostForecast(ctx context.Context, orgID string) ([]CostForecast, error) {
	// Get current cost breakdown
	breakdown, err := s.GetCostBreakdown(ctx, orgID, "monthly")
	if err != nil {
		return nil, fmt.Errorf("failed to get cost breakdown: %w", err)
	}

	var forecasts []CostForecast
	currentDate := time.Now()

	// Generate 30-day forecast based on current usage patterns
	for i := 1; i <= 30; i++ {
		forecastDate := currentDate.AddDate(0, 0, i)

		// Simple linear projection based on current daily cost
		dailyCost := breakdown.TotalCost / 30
		projectedCost := dailyCost * float64(i)

		forecasts = append(forecasts, CostForecast{
			Date:          forecastDate,
			ProjectedCost: projectedCost,
			Confidence:    0.85, // 85% confidence level
		})
	}

	return forecasts, nil
}

// GetRealTimeCostMonitoring provides real-time cost monitoring data
func (s *CostManagementService) GetRealTimeCostMonitoring(ctx context.Context, orgID string) (*RealTimeCostData, error) {
	// Get current cost breakdown
	breakdown, err := s.GetCostBreakdown(ctx, orgID, "monthly")
	if err != nil {
		return nil, fmt.Errorf("failed to get cost breakdown: %w", err)
	}

	// Get budget alerts
	alerts, err := s.GetBudgetAlerts(ctx, orgID)
	if err != nil {
		alerts = []BudgetAlert{}
	}

	// Calculate real-time metrics
	realTimeData := &RealTimeCostData{
		CurrentCost:     breakdown.TotalCost,
		DailySpend:      breakdown.TotalCost / 30,
		MonthlyBudget:   20000.0, // Default budget
		BudgetRemaining: 20000.0 - breakdown.TotalCost,
		BudgetUsed:      (breakdown.TotalCost / 20000.0) * 100,
		Alerts:          alerts,
		LastUpdated:     time.Now(),
	}

	return realTimeData, nil
}

// GetCostAllocationByTags provides detailed cost allocation by tags/projects
func (s *CostManagementService) GetCostAllocationByTags(ctx context.Context, orgID string) (*CostAllocationData, error) {
	// Get all infrastructure for the organization
	infrastructures, err := s.repoManager.Infrastructure.List(ctx, orgID, repositories.ListParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get infrastructure: %w", err)
	}

	allocationData := &CostAllocationData{
		TotalCost:       0,
		AllocationByTag: make(map[string]TagAllocation),
		Projects:        make(map[string]ProjectAllocation),
	}

	// Process each infrastructure resource
	for _, infra := range infrastructures {
		if infra.ExternalID == nil {
			continue
		}

		provider, exists := s.providers[infra.Provider]
		if !exists {
			continue
		}

		// Get resource details including cost information
		details, err := provider.GetResourceDetails(ctx, *infra.ExternalID)
		if err != nil {
			continue
		}

		// Extract cost information
		costInfo, ok := details["costInfo"].(map[string]interface{})
		if !ok {
			continue
		}

		hourlyCost := 0.0
		if hc, ok := costInfo["hourly_cost"].(float64); ok {
			hourlyCost = hc
		}

		monthlyCost := hourlyCost * 24 * 30
		allocationData.TotalCost += monthlyCost

		// Process tags for allocation
		for _, tag := range infra.Tags {
			// Parse tag in format "key=value"
			parts := strings.Split(tag, "=")
			if len(parts) == 2 {
				key := parts[0]
				value := parts[1]

				// Add to tag allocation
				if existing, exists := allocationData.AllocationByTag[key]; exists {
					existing.TotalCost += monthlyCost
					existing.Resources = append(existing.Resources, infra.ID)
					allocationData.AllocationByTag[key] = existing
				} else {
					allocationData.AllocationByTag[key] = TagAllocation{
						TagName:   key,
						TotalCost: monthlyCost,
						Resources: []string{infra.ID},
					}
				}

				// Add to project allocation (using environment tag as project)
				if key == "environment" {
					if existing, exists := allocationData.Projects[value]; exists {
						existing.TotalCost += monthlyCost
						existing.Resources = append(existing.Resources, infra.ID)
						allocationData.Projects[value] = existing
					} else {
						allocationData.Projects[value] = ProjectAllocation{
							ProjectName: value,
							TotalCost:   monthlyCost,
							Resources:   []string{infra.ID},
						}
					}
				}
			}
		}
	}

	return allocationData, nil
}

// GetCostOptimizationRecommendations provides detailed cost optimization recommendations
func (s *CostManagementService) GetCostOptimizationRecommendations(ctx context.Context, orgID string) ([]CostRecommendation, error) {
	// Get cost breakdown
	breakdown, err := s.GetCostBreakdown(ctx, orgID, "monthly")
	if err != nil {
		return nil, fmt.Errorf("failed to get cost breakdown: %w", err)
	}

	var recommendations []CostRecommendation

	// Analyze underutilized resources
	for _, resource := range breakdown.Breakdown {
		if resource.Usage.CPUUtilization < 20 && resource.Usage.MemoryUtilization < 20 {
			recommendations = append(recommendations, CostRecommendation{
				Type:             "underutilized_resource",
				Description:      fmt.Sprintf("Resource %s is underutilized (CPU: %.1f%%, Memory: %.1f%%)", resource.ResourceName, resource.Usage.CPUUtilization, resource.Usage.MemoryUtilization),
				PotentialSavings: resource.MonthlyCost * 0.5, // 50% potential savings
				Priority:         "medium",
				Action:           "Consider downsizing or stopping the resource",
			})
		}
	}

	// Check for expensive resources
	totalCost := 0.0
	for _, resource := range breakdown.Breakdown {
		totalCost += resource.MonthlyCost
	}

	for _, resource := range breakdown.Breakdown {
		if resource.MonthlyCost > totalCost*0.2 { // More than 20% of total cost
			recommendations = append(recommendations, CostRecommendation{
				Type:             "expensive_resource",
				Description:      fmt.Sprintf("Resource %s accounts for %.1f%% of total cost", resource.ResourceName, (resource.MonthlyCost/totalCost)*100),
				PotentialSavings: resource.MonthlyCost * 0.3, // 30% potential savings
				Priority:         "high",
				Action:           "Review resource specifications and consider optimization",
			})
		}
	}

	// Add general recommendations
	if len(breakdown.Breakdown) > 10 {
		recommendations = append(recommendations, CostRecommendation{
			Type:             "resource_consolidation",
			Description:      "Consider consolidating multiple small resources into larger, more cost-effective instances",
			PotentialSavings: totalCost * 0.15, // 15% potential savings
			Priority:         "medium",
			Action:           "Review resource consolidation opportunities",
		})
	}

	// Add reserved instance recommendations
	if totalCost > 1000 {
		recommendations = append(recommendations, CostRecommendation{
			Type:             "reserved_instances",
			Description:      "Consider purchasing Reserved Instances for stable workloads to reduce costs by up to 60%",
			PotentialSavings: totalCost * 0.25, // 25% potential savings
			Priority:         "high",
			Action:           "Analyze usage patterns and purchase Reserved Instances for predictable workloads",
		})
	}

	return recommendations, nil
}

// BudgetAlert represents a budget-related alert
type BudgetAlert struct {
	Type        string    `json:"type"`
	Message     string    `json:"message"`
	Severity    string    `json:"severity"`
	CurrentCost float64   `json:"currentCost"`
	Budget      float64   `json:"budget"`
	Timestamp   time.Time `json:"timestamp"`
}

// CostForecast represents a cost forecast for a specific date
type CostForecast struct {
	Date          time.Time `json:"date"`
	ProjectedCost float64   `json:"projectedCost"`
	Confidence    float64   `json:"confidence"`
}

// RealTimeCostData represents real-time cost monitoring data
type RealTimeCostData struct {
	CurrentCost     float64       `json:"currentCost"`
	DailySpend      float64       `json:"dailySpend"`
	MonthlyBudget   float64       `json:"monthlyBudget"`
	BudgetRemaining float64       `json:"budgetRemaining"`
	BudgetUsed      float64       `json:"budgetUsed"`
	Alerts          []BudgetAlert `json:"alerts"`
	LastUpdated     time.Time     `json:"lastUpdated"`
}

// CostAllocationData represents cost allocation by tags and projects
type CostAllocationData struct {
	TotalCost       float64                      `json:"totalCost"`
	AllocationByTag map[string]TagAllocation     `json:"allocationByTag"`
	Projects        map[string]ProjectAllocation `json:"projects"`
}

// TagAllocation represents cost allocation for a specific tag
type TagAllocation struct {
	TagName   string   `json:"tagName"`
	TotalCost float64  `json:"totalCost"`
	Resources []string `json:"resources"`
}

// ProjectAllocation represents cost allocation for a specific project
type ProjectAllocation struct {
	ProjectName string   `json:"projectName"`
	TotalCost   float64  `json:"totalCost"`
	Resources   []string `json:"resources"`
}

// Helper functions
func (s *CostManagementService) convertTags(tags []string) map[string]string {
	result := make(map[string]string)
	for _, tag := range tags {
		// Assume tags are in format "key=value"
		// For simplicity, we'll just use the tag as both key and value
		result[tag] = tag
	}
	return result
}

func (s *CostManagementService) matchesTags(resourceTags []string, filterTags map[string]string) bool {
	if len(filterTags) == 0 {
		return true
	}

	resourceTagMap := s.convertTags(resourceTags)

	for key, value := range filterTags {
		if resourceValue, exists := resourceTagMap[key]; !exists || resourceValue != value {
			return false
		}
	}

	return true
}

func (s *CostManagementService) generateCostTrends(ctx context.Context, orgID string, days int) []CostTrend {
	var trends []CostTrend
	currentDate := time.Now()

	// Generate simulated trends for the last N days
	for i := days; i >= 0; i-- {
		date := currentDate.AddDate(0, 0, -i)

		// Simulate daily cost with some variation
		baseCost := 30.0                // Base daily cost
		variation := float64(i%7) * 5.0 // Weekly variation
		cost := baseCost + variation

		trends = append(trends, CostTrend{
			Date:  date,
			Cost:  cost,
			Usage: cost / 40.0, // Normalized usage
		})
	}

	return trends
}

func (s *CostManagementService) generateRecommendations(breakdown map[string]ResourceCost) []CostRecommendation {
	var recommendations []CostRecommendation

	// Analyze underutilized resources
	for _, resource := range breakdown {
		if resource.Usage.CPUUtilization < 20 && resource.Usage.MemoryUtilization < 20 {
			recommendations = append(recommendations, CostRecommendation{
				Type:             "underutilized_resource",
				Description:      fmt.Sprintf("Resource %s is underutilized (CPU: %.1f%%, Memory: %.1f%%)", resource.ResourceName, resource.Usage.CPUUtilization, resource.Usage.MemoryUtilization),
				PotentialSavings: resource.MonthlyCost * 0.5, // 50% potential savings
				Priority:         "medium",
				Action:           "Consider downsizing or stopping the resource",
			})
		}
	}

	// Check for expensive resources
	totalCost := 0.0
	for _, resource := range breakdown {
		totalCost += resource.MonthlyCost
	}

	for _, resource := range breakdown {
		if resource.MonthlyCost > totalCost*0.2 { // More than 20% of total cost
			recommendations = append(recommendations, CostRecommendation{
				Type:             "expensive_resource",
				Description:      fmt.Sprintf("Resource %s accounts for %.1f%% of total cost", resource.ResourceName, (resource.MonthlyCost/totalCost)*100),
				PotentialSavings: resource.MonthlyCost * 0.3, // 30% potential savings
				Priority:         "high",
				Action:           "Review resource specifications and consider optimization",
			})
		}
	}

	// Add general recommendations
	if len(breakdown) > 10 {
		recommendations = append(recommendations, CostRecommendation{
			Type:             "resource_consolidation",
			Description:      "Consider consolidating multiple small resources into larger, more cost-effective instances",
			PotentialSavings: totalCost * 0.15, // 15% potential savings
			Priority:         "medium",
			Action:           "Review resource consolidation opportunities",
		})
	}

	return recommendations
}
