package middleware

import (
	"fmt"
	"net/http"
	"reflect"
	"strings"
	"time"

	"cloudweave/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New()
	
	// Register custom validation tags
	validate.RegisterValidation("cloud_provider", validateCloudProvider)
	validate.RegisterValidation("resource_type", validateResourceType)
	validate.RegisterValidation("deployment_status", validateDeploymentStatus)
}

// RegisterCustomValidators registers custom validators with gin's binding validator
func RegisterCustomValidators() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("cloud_provider", validateCloudProvider)
		v.RegisterValidation("resource_type", validateResourceType)
		v.RegisterValidation("deployment_status", validateDeploymentStatus)
	}
}

// ValidationMiddleware provides comprehensive request validation
func ValidationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}

// ValidateJSON validates JSON request body against a struct
func ValidateJSON(obj interface{}) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := c.ShouldBindJSON(obj); err != nil {
			var validationErrors []models.ValidationError
			
			if errs, ok := err.(validator.ValidationErrors); ok {
				for _, e := range errs {
					validationErrors = append(validationErrors, models.ValidationError{
						Field:   getJSONFieldName(obj, e.Field()),
						Tag:     e.Tag(),
						Value:   fmt.Sprintf("%v", e.Value()),
						Message: getValidationMessage(e),
					})
				}
			} else {
				validationErrors = append(validationErrors, models.ValidationError{
					Field:   "request_body",
					Tag:     "json",
					Message: "Invalid JSON format: " + err.Error(),
				})
			}

			c.JSON(http.StatusBadRequest, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "VALIDATION_ERROR",
					Message:   "Request validation failed",
					Details:   validationErrors,
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			c.Abort()
			return
		}
		
		// Validate the bound object
		if err := validate.Struct(obj); err != nil {
			var validationErrors []models.ValidationError
			
			if errs, ok := err.(validator.ValidationErrors); ok {
				for _, e := range errs {
					validationErrors = append(validationErrors, models.ValidationError{
						Field:   getJSONFieldName(obj, e.Field()),
						Tag:     e.Tag(),
						Value:   fmt.Sprintf("%v", e.Value()),
						Message: getValidationMessage(e),
					})
				}
			}

			c.JSON(http.StatusBadRequest, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "VALIDATION_ERROR",
					Message:   "Request validation failed",
					Details:   validationErrors,
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			c.Abort()
			return
		}
		
		c.Set("validatedRequest", obj)
		c.Next()
	}
}

// ValidateQuery validates query parameters
func ValidateQuery(rules map[string]string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var validationErrors []models.ValidationError
		
		for param, rule := range rules {
			value := c.Query(param)
			if value == "" && strings.Contains(rule, "required") {
				validationErrors = append(validationErrors, models.ValidationError{
					Field:   param,
					Tag:     "required",
					Message: fmt.Sprintf("Query parameter '%s' is required", param),
				})
				continue
			}
			
			if value != "" {
				// Validate based on rule
				if err := validateQueryParam(param, value, rule); err != nil {
					validationErrors = append(validationErrors, models.ValidationError{
						Field:   param,
						Tag:     rule,
						Value:   value,
						Message: err.Error(),
					})
				}
			}
		}
		
		if len(validationErrors) > 0 {
			c.JSON(http.StatusBadRequest, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "VALIDATION_ERROR",
					Message:   "Query parameter validation failed",
					Details:   validationErrors,
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// ValidatePathParams validates path parameters
func ValidatePathParams(rules map[string]string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var validationErrors []models.ValidationError
		
		for param, rule := range rules {
			value := c.Param(param)
			if value == "" {
				validationErrors = append(validationErrors, models.ValidationError{
					Field:   param,
					Tag:     "required",
					Message: fmt.Sprintf("Path parameter '%s' is required", param),
				})
				continue
			}
			
			if err := validateQueryParam(param, value, rule); err != nil {
				validationErrors = append(validationErrors, models.ValidationError{
					Field:   param,
					Tag:     rule,
					Value:   value,
					Message: err.Error(),
				})
			}
		}
		
		if len(validationErrors) > 0 {
			c.JSON(http.StatusBadRequest, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "VALIDATION_ERROR",
					Message:   "Path parameter validation failed",
					Details:   validationErrors,
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// Custom validation functions
func validateCloudProvider(fl validator.FieldLevel) bool {
	provider := fl.Field().String()
	validProviders := []string{"aws", "azure", "gcp", "digitalocean", "linode"}
	
	for _, valid := range validProviders {
		if provider == valid {
			return true
		}
	}
	return false
}

func validateResourceType(fl validator.FieldLevel) bool {
	resourceType := fl.Field().String()
	validTypes := []string{"server", "database", "storage", "network", "load_balancer", "container"}
	
	for _, valid := range validTypes {
		if resourceType == valid {
			return true
		}
	}
	return false
}

func validateDeploymentStatus(fl validator.FieldLevel) bool {
	status := fl.Field().String()
	validStatuses := []string{"pending", "running", "completed", "failed", "cancelled"}
	
	for _, valid := range validStatuses {
		if status == valid {
			return true
		}
	}
	return false
}

// Helper functions
func getJSONFieldName(obj interface{}, fieldName string) string {
	t := reflect.TypeOf(obj)
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}
	
	field, found := t.FieldByName(fieldName)
	if !found {
		return fieldName
	}
	
	jsonTag := field.Tag.Get("json")
	if jsonTag == "" {
		return fieldName
	}
	
	// Extract field name from json tag (before comma)
	if idx := strings.Index(jsonTag, ","); idx != -1 {
		return jsonTag[:idx]
	}
	
	return jsonTag
}

func getValidationMessage(e validator.FieldError) string {
	switch e.Tag() {
	case "required":
		return fmt.Sprintf("Field '%s' is required", e.Field())
	case "email":
		return fmt.Sprintf("Field '%s' must be a valid email address", e.Field())
	case "min":
		return fmt.Sprintf("Field '%s' must be at least %s characters long", e.Field(), e.Param())
	case "max":
		return fmt.Sprintf("Field '%s' must be at most %s characters long", e.Field(), e.Param())
	case "uuid":
		return fmt.Sprintf("Field '%s' must be a valid UUID", e.Field())
	case "cloud_provider":
		return fmt.Sprintf("Field '%s' must be a valid cloud provider (aws, azure, gcp, digitalocean, linode)", e.Field())
	case "resource_type":
		return fmt.Sprintf("Field '%s' must be a valid resource type", e.Field())
	case "deployment_status":
		return fmt.Sprintf("Field '%s' must be a valid deployment status", e.Field())
	default:
		return fmt.Sprintf("Field '%s' failed validation for tag '%s'", e.Field(), e.Tag())
	}
}

func validateQueryParam(param, value, rule string) error {
	// Simple validation for common rules
	switch rule {
	case "uuid":
		if len(value) != 36 {
			return fmt.Errorf("Parameter '%s' must be a valid UUID", param)
		}
	case "numeric":
		if !isNumeric(value) {
			return fmt.Errorf("Parameter '%s' must be numeric", param)
		}
	case "alpha":
		if !isAlpha(value) {
			return fmt.Errorf("Parameter '%s' must contain only letters", param)
		}
	}
	return nil
}

func isNumeric(s string) bool {
	for _, r := range s {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

func isAlpha(s string) bool {
	for _, r := range s {
		if !((r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z')) {
			return false
		}
	}
	return true
}