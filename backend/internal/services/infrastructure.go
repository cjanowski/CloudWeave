package services

import (
	"context"
	"fmt"
	"os"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"
)

type InfrastructureService struct {
	repoManager      *repositories.RepositoryManager
	cloudProviders   map[string]CloudProvider
	metricsCollector *MetricsCollector
}

func NewInfrastructureService(repoManager *repositories.RepositoryManager) *InfrastructureService {
	service := &InfrastructureService{
		repoManager:      repoManager,
		cloudProviders:   make(map[string]CloudProvider),
		metricsCollector: NewMetricsCollector(repoManager),
	}

	// Initialize cloud providers with real implementations
	ctx := context.Background()

	// AWS Provider (already has real implementation)
	awsProvider, err := NewRealAWSProvider(ctx)
	if err != nil {
		// Fallback to mock provider if real provider fails
		service.cloudProviders[models.ProviderAWS] = NewAWSProvider()
	} else {
		service.cloudProviders[models.ProviderAWS] = awsProvider
	}

	// GCP Provider
	gcpProjectID := getEnvOrDefault("GCP_PROJECT_ID", "cloudweave-demo")
	gcpProvider, err := NewRealGCPProvider(ctx, gcpProjectID)
	if err != nil {
		// Fallback to mock provider if real provider fails
		service.cloudProviders[models.ProviderGCP] = NewGCPProvider()
	} else {
		service.cloudProviders[models.ProviderGCP] = gcpProvider
	}

	// Azure Provider
	azureSubscriptionID := getEnvOrDefault("AZURE_SUBSCRIPTION_ID", "demo-subscription")
	azureResourceGroup := getEnvOrDefault("AZURE_RESOURCE_GROUP", "cloudweave-rg")
	azureLocation := getEnvOrDefault("AZURE_LOCATION", "eastus")
	azureProvider, err := NewRealAzureProvider(ctx, azureSubscriptionID, azureResourceGroup, azureLocation)
	if err != nil {
		// Fallback to mock provider if real provider fails
		service.cloudProviders[models.ProviderAzure] = NewAzureProvider()
	} else {
		service.cloudProviders[models.ProviderAzure] = azureProvider
	}

	return service
}

// CreateInfrastructure creates infrastructure and provisions it with the cloud provider
func (s *InfrastructureService) CreateInfrastructure(ctx context.Context, infra *models.Infrastructure) error {
	// Create in database first
	if err := s.repoManager.Infrastructure.Create(ctx, infra); err != nil {
		return fmt.Errorf("failed to create infrastructure in database: %w", err)
	}

	// Get cloud provider
	provider, exists := s.cloudProviders[infra.Provider]
	if !exists {
		return fmt.Errorf("unsupported cloud provider: %s", infra.Provider)
	}

	// Provision infrastructure with cloud provider
	externalID, err := provider.CreateResource(ctx, infra)
	if err != nil {
		// Update status to error
		s.repoManager.Infrastructure.UpdateStatus(ctx, infra.ID, models.InfraStatusError)
		return fmt.Errorf("failed to provision infrastructure: %w", err)
	}

	// Update with external ID and running status
	infra.ExternalID = &externalID
	infra.Status = models.InfraStatusRunning
	if err := s.repoManager.Infrastructure.Update(ctx, infra); err != nil {
		return fmt.Errorf("failed to update infrastructure with external ID: %w", err)
	}

	// Start metrics collection
	go s.metricsCollector.StartCollection(ctx, infra)

	return nil
}

// GetRealTimeStatus gets the current status from the cloud provider
func (s *InfrastructureService) GetRealTimeStatus(ctx context.Context, infra *models.Infrastructure) (string, error) {
	if infra.ExternalID == nil {
		return infra.Status, nil
	}

	provider, exists := s.cloudProviders[infra.Provider]
	if !exists {
		return infra.Status, fmt.Errorf("unsupported cloud provider: %s", infra.Provider)
	}

	return provider.GetResourceStatus(ctx, *infra.ExternalID)
}

// GetMetrics retrieves real-time metrics for infrastructure
func (s *InfrastructureService) GetMetrics(ctx context.Context, infra *models.Infrastructure) (map[string]interface{}, error) {
	if infra.ExternalID == nil {
		return nil, fmt.Errorf("infrastructure has no external ID")
	}

	provider, exists := s.cloudProviders[infra.Provider]
	if !exists {
		return nil, fmt.Errorf("unsupported cloud provider: %s", infra.Provider)
	}

	return provider.GetResourceMetrics(ctx, *infra.ExternalID)
}

// SyncWithProvider syncs infrastructure state with cloud provider
func (s *InfrastructureService) SyncWithProvider(ctx context.Context, infra *models.Infrastructure) (*models.Infrastructure, error) {
	if infra.ExternalID == nil {
		return infra, nil
	}

	provider, exists := s.cloudProviders[infra.Provider]
	if !exists {
		return nil, fmt.Errorf("unsupported cloud provider: %s", infra.Provider)
	}

	// Get current state from provider
	providerData, err := provider.GetResourceDetails(ctx, *infra.ExternalID)
	if err != nil {
		return nil, fmt.Errorf("failed to get resource details from provider: %w", err)
	}

	// Update infrastructure with provider data
	if status, ok := providerData["status"].(string); ok {
		infra.Status = status
	}
	if specs, ok := providerData["specifications"].(map[string]interface{}); ok {
		infra.Specifications = specs
	}
	if costInfo, ok := providerData["costInfo"].(map[string]interface{}); ok {
		infra.CostInfo = costInfo
	}

	// Update in database
	if err := s.repoManager.Infrastructure.Update(ctx, infra); err != nil {
		return nil, fmt.Errorf("failed to update infrastructure: %w", err)
	}

	return infra, nil
}

// DeleteFromProvider deletes infrastructure from cloud provider
func (s *InfrastructureService) DeleteFromProvider(ctx context.Context, infra *models.Infrastructure) error {
	if infra.ExternalID == nil {
		return nil
	}

	provider, exists := s.cloudProviders[infra.Provider]
	if !exists {
		return fmt.Errorf("unsupported cloud provider: %s", infra.Provider)
	}

	return provider.DeleteResource(ctx, *infra.ExternalID)
}

// CloudProvider interface for cloud provider abstraction
type CloudProvider interface {
	CreateResource(ctx context.Context, infra *models.Infrastructure) (string, error)
	GetResourceStatus(ctx context.Context, externalID string) (string, error)
	GetResourceMetrics(ctx context.Context, externalID string) (map[string]interface{}, error)
	GetResourceDetails(ctx context.Context, externalID string) (map[string]interface{}, error)
	DeleteResource(ctx context.Context, externalID string) error
}

// MetricsCollector handles real-time metrics collection
type MetricsCollector struct {
	repoManager *repositories.RepositoryManager
}

func NewMetricsCollector(repoManager *repositories.RepositoryManager) *MetricsCollector {
	return &MetricsCollector{repoManager: repoManager}
}

func (mc *MetricsCollector) StartCollection(ctx context.Context, infra *models.Infrastructure) {
	// This would typically run in a separate goroutine and collect metrics periodically
	// For now, we'll create a simple implementation
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Collect and store metrics
			metric := &models.Metric{
				ID:           fmt.Sprintf("%s-%d", infra.ID, time.Now().Unix()),
				ResourceID:   &infra.ID,
				ResourceType: "infrastructure",
				MetricName:   "infrastructure_health",
				Value:        1.0, // Placeholder
				Unit:         "status",
				Timestamp:    time.Now(),
			}

			mc.repoManager.Metric.Create(ctx, metric)
		}
	}
}

// GetProviders returns the cloud providers map
func (s *InfrastructureService) GetProviders() map[string]CloudProvider {
	return s.cloudProviders
}

// getEnvOrDefault gets an environment variable or returns a default value
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
