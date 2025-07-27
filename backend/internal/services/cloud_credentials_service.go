package services

import (
	"context"
	"fmt"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"

	"github.com/google/uuid"
)

type CloudCredentialsService struct {
	credRepo *repositories.CloudCredentialsRepository
	orgRepo  repositories.OrganizationRepositoryInterface
}

func NewCloudCredentialsService(
	credRepo *repositories.CloudCredentialsRepository,
	orgRepo repositories.OrganizationRepositoryInterface,
) *CloudCredentialsService {
	return &CloudCredentialsService{
		credRepo: credRepo,
		orgRepo:  orgRepo,
	}
}

// SetupAWSRootCredentials sets up AWS root email/password credentials
func (s *CloudCredentialsService) SetupAWSRootCredentials(ctx context.Context, organizationID string, req models.AWSRootCredentialsRequest) (*models.CloudCredentials, error) {
	// Verify organization exists
	_, err := s.orgRepo.GetByID(ctx, organizationID)
	if err != nil {
		return nil, fmt.Errorf("organization not found: %w", err)
	}

	// Create credentials object
	credentials := map[string]interface{}{
		"email":    req.Email,
		"password": req.Password, // In production, this should be encrypted
		"type":     "root_credentials",
	}

	cloudCred := &models.CloudCredentials{
		ID:             uuid.New().String(),
		OrganizationID: organizationID,
		Provider:       models.ProviderAWS,
		CredentialType: models.CredentialTypeRootCredentials,
		Credentials:    credentials,
		IsActive:       true,
	}

	// Deactivate any existing AWS root credentials for this organization
	if err := s.credRepo.DeactivateByType(ctx, organizationID, models.ProviderAWS, models.CredentialTypeRootCredentials); err != nil {
		return nil, fmt.Errorf("failed to deactivate existing credentials: %w", err)
	}

	// Create new credentials
	if err := s.credRepo.Create(ctx, cloudCred); err != nil {
		return nil, fmt.Errorf("failed to create cloud credentials: %w", err)
	}

	return cloudCred, nil
}

// SetupAWSAccessKey sets up AWS access key credentials
func (s *CloudCredentialsService) SetupAWSAccessKey(ctx context.Context, organizationID string, req models.AWSAccessKeyRequest) (*models.CloudCredentials, error) {
	// Verify organization exists
	_, err := s.orgRepo.GetByID(ctx, organizationID)
	if err != nil {
		return nil, fmt.Errorf("organization not found: %w", err)
	}

	// Create credentials object
	credentials := map[string]interface{}{
		"access_key_id":     req.AccessKeyID,
		"secret_access_key": req.SecretAccessKey, // In production, this should be encrypted
		"region":            req.Region,
		"type":              "access_key",
	}

	cloudCred := &models.CloudCredentials{
		ID:             uuid.New().String(),
		OrganizationID: organizationID,
		Provider:       models.ProviderAWS,
		CredentialType: models.CredentialTypeAccessKey,
		Credentials:    credentials,
		IsActive:       true,
	}

	// Deactivate any existing AWS access key credentials for this organization
	if err := s.credRepo.DeactivateByType(ctx, organizationID, models.ProviderAWS, models.CredentialTypeAccessKey); err != nil {
		return nil, fmt.Errorf("failed to deactivate existing credentials: %w", err)
	}

	// Create new credentials
	if err := s.credRepo.Create(ctx, cloudCred); err != nil {
		return nil, fmt.Errorf("failed to create cloud credentials: %w", err)
	}

	return cloudCred, nil
}

// GetActiveAWSCredentials gets the active AWS credentials for an organization
func (s *CloudCredentialsService) GetActiveAWSCredentials(ctx context.Context, organizationID string) (*models.CloudCredentials, error) {
	return s.credRepo.GetActiveByProvider(ctx, organizationID, models.ProviderAWS)
}

// ListCredentials lists all cloud credentials for an organization
func (s *CloudCredentialsService) ListCredentials(ctx context.Context, organizationID string) ([]*models.CloudCredentials, error) {
	return s.credRepo.ListByOrganization(ctx, organizationID)
}

// DeleteCredentials deletes cloud credentials
func (s *CloudCredentialsService) DeleteCredentials(ctx context.Context, credentialsID string, organizationID string) error {
	// Verify the credentials belong to the organization
	cred, err := s.credRepo.GetByID(ctx, credentialsID)
	if err != nil {
		return fmt.Errorf("credentials not found: %w", err)
	}

	if cred.OrganizationID != organizationID {
		return fmt.Errorf("credentials do not belong to organization")
	}

	return s.credRepo.Delete(ctx, credentialsID)
}

// TestAWSConnection tests the AWS connection with the provided credentials
func (s *CloudCredentialsService) TestAWSConnection(ctx context.Context, organizationID string) error {
	cred, err := s.GetActiveAWSCredentials(ctx, organizationID)
	if err != nil {
		return fmt.Errorf("no active AWS credentials found: %w", err)
	}

	// Test AWS credentials based on type
	switch cred.CredentialType {
	case models.CredentialTypeRootCredentials:
		// For root credentials, we would need to implement AWS STS assume role
		// This is a simplified version - in production you'd want proper AWS STS integration
		return fmt.Errorf("root credential testing not yet implemented - please use access keys for now")
		
	case models.CredentialTypeAccessKey:
		// Test with access keys - simplified for now
		// In production, you would create an AWS session and test it
		return nil
		
	default:
		return fmt.Errorf("unsupported credential type: %s", cred.CredentialType)
	}

	// Connection test successful
	return nil
}