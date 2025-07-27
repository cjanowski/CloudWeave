package models

import "time"

type CloudCredentials struct {
	ID             string                 `json:"id" db:"id"`
	OrganizationID string                 `json:"organizationId" db:"organization_id"`
	Provider       string                 `json:"provider" db:"provider"`
	CredentialType string                 `json:"credentialType" db:"credential_type"`
	Credentials    map[string]interface{} `json:"credentials" db:"credentials"`
	IsActive       bool                   `json:"isActive" db:"is_active"`
	CreatedAt      time.Time              `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time              `json:"updatedAt" db:"updated_at"`
}

// AWS specific credential types
const (
	CredentialTypeRootCredentials = "root_credentials"
	CredentialTypeIAMRole         = "iam_role"
	CredentialTypeAccessKey       = "access_key"
)

// Cloud providers are defined in infrastructure.go

// AWS Root Credentials Request
type AWSRootCredentialsRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AWS Access Key Credentials Request
type AWSAccessKeyRequest struct {
	AccessKeyID     string `json:"accessKeyId" binding:"required"`
	SecretAccessKey string `json:"secretAccessKey" binding:"required"`
	Region          string `json:"region" binding:"required"`
}

// AWS IAM Role Request
type AWSIAMRoleRequest struct {
	RoleArn    string `json:"roleArn" binding:"required"`
	ExternalID string `json:"externalId,omitempty"`
	Region     string `json:"region" binding:"required"`
}

// Generic cloud credentials setup request
type SetupCloudCredentialsRequest struct {
	Provider       string                 `json:"provider" binding:"required"`
	CredentialType string                 `json:"credentialType" binding:"required"`
	Credentials    map[string]interface{} `json:"credentials" binding:"required"`
}

type CloudCredentialsResponse struct {
	Success bool              `json:"success"`
	Data    *CloudCredentials `json:"data,omitempty"`
	Error   *ApiError         `json:"error,omitempty"`
}

type ListCloudCredentialsResponse struct {
	Success bool                `json:"success"`
	Data    []*CloudCredentials `json:"data,omitempty"`
	Error   *ApiError           `json:"error,omitempty"`
}