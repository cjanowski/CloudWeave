package handlers

import (
	"log"
	"net/http"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/services"

	"github.com/gin-gonic/gin"
)

var cloudCredentialsService *services.CloudCredentialsService

// InitializeCloudCredentialsService initializes the cloud credentials service
func InitializeCloudCredentialsService(service *services.CloudCredentialsService) {
	cloudCredentialsService = service
}

// SetupAWSRootCredentials handles AWS root credentials setup
func SetupAWSRootCredentials(c *gin.Context) {
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
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "USER_NOT_FOUND",
				Message:   "User not found",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	var req models.AWSRootCredentialsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
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

	credentials, err := cloudCredentialsService.SetupAWSRootCredentials(c.Request.Context(), user.OrganizationID, req)
	if err != nil {
		log.Printf("Failed to setup AWS root credentials: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "SETUP_FAILED",
				Message:   "Failed to setup AWS credentials",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Don't return sensitive credentials in response
	credentials.Credentials = map[string]interface{}{
		"type": "root_credentials",
	}

	c.JSON(http.StatusCreated, models.ApiResponse{
		Success:   true,
		Data:      credentials,
		RequestID: c.GetString("requestID"),
	})
}

// SetupAWSAccessKey handles AWS access key setup
func SetupAWSAccessKey(c *gin.Context) {
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
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "USER_NOT_FOUND",
				Message:   "User not found",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	var req models.AWSAccessKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
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

	credentials, err := cloudCredentialsService.SetupAWSAccessKey(c.Request.Context(), user.OrganizationID, req)
	if err != nil {
		log.Printf("Failed to setup AWS access key: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "SETUP_FAILED",
				Message:   "Failed to setup AWS credentials",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Don't return sensitive credentials in response
	credentials.Credentials = map[string]interface{}{
		"type":   "access_key",
		"region": req.Region,
	}

	c.JSON(http.StatusCreated, models.ApiResponse{
		Success:   true,
		Data:      credentials,
		RequestID: c.GetString("requestID"),
	})
}

// GetCloudCredentials lists all cloud credentials for the user's organization
func GetCloudCredentials(c *gin.Context) {
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
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "USER_NOT_FOUND",
				Message:   "User not found",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	credentials, err := cloudCredentialsService.ListCredentials(c.Request.Context(), user.OrganizationID)
	if err != nil {
		log.Printf("Failed to list cloud credentials: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "LIST_FAILED",
				Message:   "Failed to retrieve cloud credentials",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success:   true,
		Data:      credentials,
		RequestID: c.GetString("requestID"),
	})
}

// TestAWSConnection tests the AWS connection
func TestAWSConnection(c *gin.Context) {
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
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "USER_NOT_FOUND",
				Message:   "User not found",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	err = cloudCredentialsService.TestAWSConnection(c.Request.Context(), user.OrganizationID)
	if err != nil {
		log.Printf("AWS connection test failed: %v", err)
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "CONNECTION_FAILED",
				Message:   err.Error(),
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"message": "AWS connection successful",
		},
		RequestID: c.GetString("requestID"),
	})
}

// DeleteCloudCredentials deletes cloud credentials
func DeleteCloudCredentials(c *gin.Context) {
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

	credentialsID := c.Param("id")
	if credentialsID == "" {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INVALID_REQUEST",
				Message:   "Credentials ID is required",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Get user's organization ID
	user, err := authService.GetUserByID(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "USER_NOT_FOUND",
				Message:   "User not found",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	err = cloudCredentialsService.DeleteCredentials(c.Request.Context(), credentialsID, user.OrganizationID)
	if err != nil {
		log.Printf("Failed to delete cloud credentials: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "DELETE_FAILED",
				Message:   "Failed to delete cloud credentials",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"message": "Cloud credentials deleted successfully",
		},
		RequestID: c.GetString("requestID"),
	})
}