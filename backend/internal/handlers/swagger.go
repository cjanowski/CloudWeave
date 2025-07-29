package handlers

import (
	"net/http"

	"cloudweave/internal/models"

	"github.com/gin-gonic/gin"
)

// @title CloudWeave API
// @version 1.0.0
// @description CloudWeave cloud platform management system API
// @termsOfService https://cloudweave.com/terms

// @contact.name CloudWeave API Support
// @contact.email support@cloudweave.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:3001
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

// @tag.name Authentication
// @tag.description Authentication and authorization endpoints

// @tag.name Infrastructure
// @tag.description Infrastructure management endpoints

// @tag.name Deployments
// @tag.description Deployment management endpoints

// @tag.name Monitoring
// @tag.description Monitoring and metrics endpoints

// @tag.name Security
// @tag.description Security and compliance endpoints

// @tag.name Cost Management
// @tag.description Cost tracking and optimization endpoints

// @tag.name RBAC
// @tag.description Role-based access control endpoints

// @tag.name Audit
// @tag.description Audit logging and compliance endpoints

// SwaggerInfo provides API information for Swagger documentation
// @Summary Get API information
// @Description Returns basic information about the CloudWeave API
// @Tags System
// @Accept json
// @Produce json
// @Success 200 {object} models.ApiResponse{data=map[string]interface{}}
// @Router /info [get]
func SwaggerInfo(c *gin.Context) {
	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"name":        "CloudWeave API",
			"version":     "1.0.0",
			"description": "CloudWeave cloud platform management system API",
			"endpoints": map[string]interface{}{
				"documentation": "/swagger/index.html",
				"health":        "/api/v1/health",
				"websocket":     "/api/v1/ws",
			},
			"features": []string{
				"Infrastructure Management",
				"Deployment Automation",
				"Real-time Monitoring",
				"Security Scanning",
				"Cost Optimization",
				"Compliance Reporting",
				"Role-based Access Control",
				"Audit Logging",
			},
		},
		RequestID: c.GetString("requestID"),
	})
}

// Common response models for Swagger documentation

// SuccessResponse represents a successful API response
type SuccessResponse struct {
	Success   bool        `json:"success" example:"true"`
	Data      interface{} `json:"data,omitempty"`
	RequestID string      `json:"requestId,omitempty" example:"req_123e4567-e89b-12d3-a456-426614174000"`
}

// ErrorResponse represents an error API response
type ErrorResponse struct {
	Success   bool              `json:"success" example:"false"`
	Error     *models.ApiError  `json:"error,omitempty"`
	RequestID string            `json:"requestId,omitempty" example:"req_123e4567-e89b-12d3-a456-426614174000"`
}

// ValidationErrorResponse represents a validation error response
type ValidationErrorResponse struct {
	Success   bool                      `json:"success" example:"false"`
	Error     *ValidationErrorDetails   `json:"error,omitempty"`
	RequestID string                    `json:"requestId,omitempty" example:"req_123e4567-e89b-12d3-a456-426614174000"`
}

// ValidationErrorDetails contains validation error information
type ValidationErrorDetails struct {
	Code      string                    `json:"code" example:"VALIDATION_ERROR"`
	Message   string                    `json:"message" example:"Request validation failed"`
	Details   []models.ValidationError  `json:"details,omitempty"`
	Timestamp string                    `json:"timestamp" example:"2024-01-01T12:00:00Z"`
}

// PaginationMeta represents pagination metadata
type PaginationMeta struct {
	Page       int `json:"page" example:"1"`
	PerPage    int `json:"perPage" example:"20"`
	Total      int `json:"total" example:"100"`
	TotalPages int `json:"totalPages" example:"5"`
}

// PaginatedResponse represents a paginated API response
type PaginatedResponse struct {
	Success    bool           `json:"success" example:"true"`
	Data       interface{}    `json:"data,omitempty"`
	Pagination PaginationMeta `json:"pagination,omitempty"`
	RequestID  string         `json:"requestId,omitempty" example:"req_123e4567-e89b-12d3-a456-426614174000"`
}