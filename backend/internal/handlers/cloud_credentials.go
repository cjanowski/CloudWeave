package handlers

import (
	"log"
	"net/http"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"
	"cloudweave/internal/services"

	"github.com/gin-gonic/gin"
)

var (
	cloudCredentialsRepo *repositories.CloudCredentialsRepository
	awsProvider          *services.AWSProvider
	gcpProvider          *services.GCPProvider
	azureProvider        *services.AzureProvider
)

// InitializeCloudCredentialsServices initializes the cloud credentials services
func InitializeCloudCredentialsServices(
	ccRepo *repositories.CloudCredentialsRepository,
	aws *services.AWSProvider,
	gcp *services.GCPProvider,
	azure *services.AzureProvider,
) {
	cloudCredentialsRepo = ccRepo
	awsProvider = aws
	gcpProvider = gcp
	azureProvider = azure
}

// GetCloudProviders returns all cloud providers for the organization
// @Summary Get cloud providers
// @Description Get all cloud providers configured for the organization
// @Tags Cloud Providers
// @Accept json
// @Produce json
// @Success 200 {object} SuccessResponse{data=[]models.CloudCredentials}
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /cloud-providers [get]
func GetCloudProviders(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "UNAUTHORIZED",
				Message:   "Authentication required",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Get user's organization ID
	user, err := authService.GetUserByID(c.Request.Context(), userID.(string))
	if err != nil {
		log.Printf("Failed to get user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INTERNAL_ERROR",
				Message:   "Failed to get user information",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	providers, err := cloudCredentialsRepo.GetByOrganizationID(c.Request.Context(), user.OrganizationID)
	if err != nil {
		log.Printf("Failed to get cloud providers for organization %s: %v", user.OrganizationID, err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INTERNAL_ERROR",
				Message:   "Failed to get cloud providers",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"providers": providers,
		},
		RequestID: c.GetString("requestID"),
	})
}

// AddCloudProvider adds a new cloud provider
// @Summary Add cloud provider
// @Description Add a new cloud provider configuration
// @Tags Cloud Providers
// @Accept json
// @Produce json
// @Param request body models.SetupCloudCredentialsRequest true "Cloud provider configuration"
// @Success 201 {object} SuccessResponse{data=models.CloudCredentials}
// @Failure 400 {object} ValidationErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /cloud-providers [post]
func AddCloudProvider(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "UNAUTHORIZED",
				Message:   "Authentication required",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	var req models.SetupCloudCredentialsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Cloud provider validation error: %v", err)
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "VALIDATION_ERROR",
				Message:   err.Error(),
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Get user's organization ID
	user, err := authService.GetUserByID(c.Request.Context(), userID.(string))
	if err != nil {
		log.Printf("Failed to get user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INTERNAL_ERROR",
				Message:   "Failed to get user information",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Test the connection before saving
	valid, err := testProviderConnection(req.Provider, req.CredentialType, req.Credentials)
	if err != nil {
		log.Printf("Failed to test cloud provider connection: %v", err)
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "CONNECTION_TEST_FAILED",
				Message:   "Failed to validate cloud provider credentials: " + err.Error(),
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	if !valid {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INVALID_CREDENTIALS",
				Message:   "Cloud provider credentials are invalid",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Create cloud credentials
	credentials := &models.CloudCredentials{
		OrganizationID: user.OrganizationID,
		Provider:       req.Provider,
		CredentialType: req.CredentialType,
		Credentials:    req.Credentials,
		IsActive:       true,
	}

	createdCredentials, err := cloudCredentialsRepo.Create(c.Request.Context(), credentials)
	if err != nil {
		log.Printf("Failed to create cloud credentials: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INTERNAL_ERROR",
				Message:   "Failed to save cloud provider credentials",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("Cloud provider added successfully for organization: %s", user.OrganizationID)

	c.JSON(http.StatusCreated, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"provider": createdCredentials,
		},
		RequestID: c.GetString("requestID"),
	})
}

// TestCloudProviderConnection tests cloud provider credentials
// @Summary Test cloud provider connection
// @Description Test cloud provider credentials without saving them
// @Tags Cloud Providers
// @Accept json
// @Produce json
// @Param request body models.SetupCloudCredentialsRequest true "Cloud provider credentials to test"
// @Success 200 {object} SuccessResponse{data=map[string]interface{}}
// @Failure 400 {object} ValidationErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /cloud-providers/test-connection [post]
func TestCloudProviderConnection(c *gin.Context) {
	var req models.SetupCloudCredentialsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Test connection validation error: %v", err)
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "VALIDATION_ERROR",
				Message:   err.Error(),
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	valid, err := testProviderConnection(req.Provider, req.CredentialType, req.Credentials)
	if err != nil {
		log.Printf("Connection test failed: %v", err)
		c.JSON(http.StatusOK, models.ApiResponse{
			Success: true,
			Data: map[string]interface{}{
				"validationResult": map[string]interface{}{
					"valid":   false,
					"message": err.Error(),
					"errors": []map[string]interface{}{
						{
							"field":   "credentials",
							"message": err.Error(),
							"code":    "CONNECTION_FAILED",
						},
					},
				},
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"validationResult": map[string]interface{}{
				"valid":       valid,
				"message":     "Connection successful",
				"permissions": []string{}, // TODO: Get actual permissions
				"limitations": []string{}, // TODO: Get actual limitations
				"regions":     []string{}, // TODO: Get available regions
				"services":    []string{}, // TODO: Get available services
			},
		},
		RequestID: c.GetString("requestID"),
	})
}

// UpdateCloudProvider updates an existing cloud provider
// @Summary Update cloud provider
// @Description Update an existing cloud provider configuration
// @Tags Cloud Providers
// @Accept json
// @Produce json
// @Param id path string true "Provider ID"
// @Param request body models.SetupCloudCredentialsRequest true "Updated cloud provider configuration"
// @Success 200 {object} SuccessResponse{data=models.CloudCredentials}
// @Failure 400 {object} ValidationErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /cloud-providers/{id} [put]
func UpdateCloudProvider(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "UNAUTHORIZED",
				Message:   "Authentication required",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	providerID := c.Param("id")
	if providerID == "" {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INVALID_PROVIDER_ID",
				Message:   "Provider ID is required",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	var req models.SetupCloudCredentialsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Update cloud provider validation error: %v", err)
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "VALIDATION_ERROR",
				Message:   err.Error(),
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Get user's organization ID
	user, err := authService.GetUserByID(c.Request.Context(), userID.(string))
	if err != nil {
		log.Printf("Failed to get user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INTERNAL_ERROR",
				Message:   "Failed to get user information",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Get existing provider to verify ownership
	existingProvider, err := cloudCredentialsRepo.GetByID(c.Request.Context(), providerID)
	if err != nil {
		log.Printf("Failed to get cloud provider %s: %v", providerID, err)
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "PROVIDER_NOT_FOUND",
				Message:   "Cloud provider not found",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Verify organization ownership
	if existingProvider.OrganizationID != user.OrganizationID {
		c.JSON(http.StatusForbidden, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "ACCESS_DENIED",
				Message:   "Access denied to this cloud provider",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Test the connection if credentials are being updated
	if len(req.Credentials) > 0 {
		valid, err := testProviderConnection(req.Provider, req.CredentialType, req.Credentials)
		if err != nil {
			log.Printf("Failed to test updated cloud provider connection: %v", err)
			c.JSON(http.StatusBadRequest, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "CONNECTION_TEST_FAILED",
					Message:   "Failed to validate updated cloud provider credentials: " + err.Error(),
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			return
		}

		if !valid {
			c.JSON(http.StatusBadRequest, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "INVALID_CREDENTIALS",
					Message:   "Updated cloud provider credentials are invalid",
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			return
		}
	}

	// Update the provider
	updateData := &models.CloudCredentials{
		ID:             providerID,
		OrganizationID: user.OrganizationID,
		Provider:       req.Provider,
		CredentialType: req.CredentialType,
		Credentials:    req.Credentials,
		IsActive:       true,
	}

	updatedProvider, err := cloudCredentialsRepo.Update(c.Request.Context(), updateData)
	if err != nil {
		log.Printf("Failed to update cloud provider %s: %v", providerID, err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INTERNAL_ERROR",
				Message:   "Failed to update cloud provider",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("Cloud provider updated successfully: %s", providerID)

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"provider": updatedProvider,
		},
		RequestID: c.GetString("requestID"),
	})
}

// DeleteCloudProvider deletes a cloud provider
// @Summary Delete cloud provider
// @Description Delete a cloud provider configuration
// @Tags Cloud Providers
// @Accept json
// @Produce json
// @Param id path string true "Provider ID"
// @Success 200 {object} SuccessResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /cloud-providers/{id} [delete]
func DeleteCloudProvider(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "UNAUTHORIZED",
				Message:   "Authentication required",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	providerID := c.Param("id")
	if providerID == "" {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INVALID_PROVIDER_ID",
				Message:   "Provider ID is required",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Get user's organization ID
	user, err := authService.GetUserByID(c.Request.Context(), userID.(string))
	if err != nil {
		log.Printf("Failed to get user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INTERNAL_ERROR",
				Message:   "Failed to get user information",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Get existing provider to verify ownership
	existingProvider, err := cloudCredentialsRepo.GetByID(c.Request.Context(), providerID)
	if err != nil {
		log.Printf("Failed to get cloud provider %s: %v", providerID, err)
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "PROVIDER_NOT_FOUND",
				Message:   "Cloud provider not found",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Verify organization ownership
	if existingProvider.OrganizationID != user.OrganizationID {
		c.JSON(http.StatusForbidden, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "ACCESS_DENIED",
				Message:   "Access denied to this cloud provider",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Delete the provider
	err = cloudCredentialsRepo.Delete(c.Request.Context(), providerID)
	if err != nil {
		log.Printf("Failed to delete cloud provider %s: %v", providerID, err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INTERNAL_ERROR",
				Message:   "Failed to delete cloud provider",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("Cloud provider deleted successfully: %s", providerID)

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"message": "Cloud provider deleted successfully",
		},
		RequestID: c.GetString("requestID"),
	})
}

// Helper function to test provider connections
func testProviderConnection(provider, credentialType string, credentials map[string]interface{}) (bool, error) {
	switch provider {
	case "aws":
		if awsProvider == nil {
			return false, nil // Provider not initialized, assume valid for now
		}
		// TODO: Implement AWS connection test
		return true, nil
	case "gcp":
		if gcpProvider == nil {
			return false, nil // Provider not initialized, assume valid for now
		}
		// TODO: Implement GCP connection test
		return true, nil
	case "azure":
		if azureProvider == nil {
			return false, nil // Provider not initialized, assume valid for now
		}
		// TODO: Implement Azure connection test
		return true, nil
	default:
		return false, nil
	}
}