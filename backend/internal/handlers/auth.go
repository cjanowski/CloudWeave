package handlers

import (
	"log"
	"net/http"
	"strings"
	"time"

	"cloudweave/internal/config"
	"cloudweave/internal/database"
	"cloudweave/internal/models"
	"cloudweave/internal/repositories"
	"cloudweave/internal/services"

	"github.com/gin-gonic/gin"
)

var (
	jwtService   *services.JWTService
	authService  *services.AuthService
	ssoService   *services.SSOService
	auditService *services.AuditService
)

// InitializeAuthServices initializes the authentication services
func InitializeAuthServices(cfg *config.Config, db *database.Database, as *services.AuditService) {
	blacklistService := services.NewTokenBlacklistService(db.DB)
	jwtService = services.NewJWTService(cfg, blacklistService)
	passwordService := services.NewPasswordService()
	userRepo := repositories.NewUserRepository(db.DB)
	orgRepo := repositories.NewOrganizationRepository(db.DB)

	authService = services.NewAuthService(userRepo, orgRepo, jwtService, passwordService, blacklistService)
	ssoService = services.NewSSOService(cfg, userRepo, orgRepo, authService, jwtService)
	auditService = as
}

// GetJWTService returns the initialized JWT service
func GetJWTService() *services.JWTService {
	return jwtService
}

// HealthCheck returns the health status of the API
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"status":      "healthy",
			"timestamp":   time.Now(),
			"version":     "1.0.0",
			"environment": "development",
		},
		RequestID: c.GetString("requestID"),
	})
}

// HealthCheckWithDB returns the health status of the API including database connectivity
func HealthCheckWithDB(db *database.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		status := "healthy"
		statusCode := http.StatusOK

		// Check database health
		dbStatus := "healthy"
		if err := db.Health(); err != nil {
			log.Printf("Database health check failed: %v", err)
			dbStatus = "unhealthy"
			status = "degraded"
			statusCode = http.StatusServiceUnavailable
		}

		// Get migration version
		version, dirty, err := db.GetVersion()
		migrationInfo := map[string]interface{}{
			"version": version,
			"dirty":   dirty,
		}
		if err != nil {
			log.Printf("Failed to get migration version: %v", err)
			migrationInfo["error"] = err.Error()
		}

		c.JSON(statusCode, models.ApiResponse{
			Success: status == "healthy",
			Data: map[string]interface{}{
				"status":      status,
				"timestamp":   time.Now(),
				"version":     "1.0.0",
				"environment": "development",
				"database": map[string]interface{}{
					"status":    dbStatus,
					"migration": migrationInfo,
				},
			},
			RequestID: c.GetString("requestID"),
		})
	}
}

// Login handles user authentication
// @Summary User login
// @Description Authenticate user with email and password
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "Login credentials"
// @Success 200 {object} SuccessResponse{data=models.LoginResponse}
// @Failure 400 {object} ValidationErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/login [post]
func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Login validation error: %v", err)
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

	log.Printf("Login request received - Email: %s", req.Email)

	// Use the auth service for authentication
	response, err := authService.Login(c.Request.Context(), req)
	if err != nil {
		log.Printf("Login failed for user %s: %v", req.Email, err)

		// Determine appropriate status code based on error
		statusCode := http.StatusUnauthorized
		errorCode := "LOGIN_FAILED"
		errorMessage := "Invalid email or password"

		if strings.Contains(err.Error(), "validation") {
			statusCode = http.StatusBadRequest
			errorCode = "VALIDATION_ERROR"
			errorMessage = err.Error()
		} else if strings.Contains(err.Error(), "token") {
			statusCode = http.StatusInternalServerError
			errorCode = "TOKEN_GENERATION_ERROR"
			errorMessage = "Authentication successful but failed to generate tokens"
		}

		c.JSON(statusCode, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      errorCode,
				Message:   errorMessage,
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("Login successful for user: %s", req.Email)

	// Audit log
	go func() {
		ctx := c.Copy()
		auditService.Record(ctx, models.ActionLogin, "user", response.User.ID, nil)
	}()

	c.JSON(http.StatusOK, models.ApiResponse{
		Success:   true,
		Data:      response,
		RequestID: c.GetString("requestID"),
	})
}

// Register handles user registration
// @Summary User registration
// @Description Register a new user account
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body models.RegisterRequest true "Registration details"
// @Success 201 {object} SuccessResponse{data=models.RegisterResponse}
// @Failure 400 {object} ValidationErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/register [post]
func Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Registration validation error: %v", err)
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

	log.Printf("Registration request received - Email: %s, Name: %s", req.Email, req.Name)

	// Use the auth service for registration
	response, err := authService.Register(c.Request.Context(), req)
	if err != nil {
		log.Printf("Registration failed for user %s: %v", req.Email, err)

		// Determine appropriate status code based on error
		statusCode := http.StatusBadRequest
		errorCode := "REGISTRATION_FAILED"
		errorMessage := err.Error()

		if strings.Contains(err.Error(), "already exists") {
			statusCode = http.StatusConflict
			errorCode = "EMAIL_ALREADY_EXISTS"
		} else if strings.Contains(err.Error(), "organization") {
			errorCode = "INVALID_ORGANIZATION"
		} else if strings.Contains(err.Error(), "password") {
			errorCode = "PASSWORD_VALIDATION_ERROR"
		} else if strings.Contains(err.Error(), "token") {
			statusCode = http.StatusInternalServerError
			errorCode = "TOKEN_GENERATION_ERROR"
			errorMessage = "Registration successful but failed to generate tokens"
		}

		c.JSON(statusCode, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      errorCode,
				Message:   errorMessage,
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("Registration successful for user: %s", req.Email)

	c.JSON(http.StatusCreated, models.ApiResponse{
		Success:   true,
		Data:      response,
		RequestID: c.GetString("requestID"),
	})
}

// RefreshToken handles token refresh
func RefreshToken(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Token refresh validation error: %v", err)
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

	log.Printf("Token refresh request received")

	// Use the auth service for token refresh
	response, err := authService.RefreshToken(c.Request.Context(), req)
	if err != nil {
		log.Printf("Token refresh failed: %v", err)

		// Determine appropriate status code based on error
		statusCode := http.StatusUnauthorized
		errorCode := "INVALID_REFRESH_TOKEN"
		errorMessage := "Invalid or expired refresh token"

		if strings.Contains(err.Error(), "user not found") {
			errorCode = "USER_NOT_FOUND"
			errorMessage = "User associated with token no longer exists"
		} else if strings.Contains(err.Error(), "generate") {
			statusCode = http.StatusInternalServerError
			errorCode = "TOKEN_GENERATION_ERROR"
			errorMessage = "Failed to generate new tokens"
		}

		c.JSON(statusCode, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      errorCode,
				Message:   errorMessage,
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("Token refresh successful")

	c.JSON(http.StatusOK, models.ApiResponse{
		Success:   true,
		Data:      response,
		RequestID: c.GetString("requestID"),
	})
}

// Logout handles user logout
func Logout(c *gin.Context) {
	// Get tokens from request
	accessToken := c.GetString("token") // Set by auth middleware

	var req struct {
		RefreshToken string `json:"refreshToken"`
	}

	// Try to get refresh token from request body (optional)
	if err := c.ShouldBindJSON(&req); err != nil {
		// If no refresh token provided, just blacklist access token
		req.RefreshToken = ""
	}

	// Perform logout
	if err := authService.Logout(c.Request.Context(), accessToken, req.RefreshToken); err != nil {
		log.Printf("Logout failed: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "LOGOUT_FAILED",
				Message:   "Failed to logout user",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("User logged out successfully")

	// Audit log
	go func() {
		ctx := c.Copy()
		userID, _ := c.Get("userID")
		auditService.Record(ctx, models.ActionLogout, "user", userID.(string), nil)
	}()

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"message": "Logged out successfully",
		},
		RequestID: c.GetString("requestID"),
	})
}

// GetCurrentUser returns the current authenticated user
func GetCurrentUser(c *gin.Context) {
	// Extract user ID from JWT token (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		log.Printf("User ID not found in context")
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

	userIDStr, ok := userID.(string)
	if !ok {
		log.Printf("Invalid user ID type in context")
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INTERNAL_ERROR",
				Message:   "Invalid user context",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Get user from database
	user, err := authService.GetUserByID(c.Request.Context(), userIDStr)
	if err != nil {
		log.Printf("Failed to get current user %s: %v", userIDStr, err)
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

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"user": user,
		},
		RequestID: c.GetString("requestID"),
	})
}

// ChangePassword handles password change requests
func ChangePassword(c *gin.Context) {
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

	var req struct {
		CurrentPassword string `json:"currentPassword" binding:"required"`
		NewPassword     string `json:"newPassword" binding:"required,min=8"`
	}

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

	userIDStr := userID.(string)
	if err := authService.ChangePassword(c.Request.Context(), userIDStr, req.CurrentPassword, req.NewPassword); err != nil {
		log.Printf("Password change failed for user %s: %v", userIDStr, err)

		statusCode := http.StatusBadRequest
		errorCode := "PASSWORD_CHANGE_FAILED"
		if strings.Contains(err.Error(), "current password is incorrect") {
			statusCode = http.StatusUnauthorized
			errorCode = "INVALID_CURRENT_PASSWORD"
		} else if strings.Contains(err.Error(), "validation failed") {
			errorCode = "PASSWORD_VALIDATION_ERROR"
		}

		c.JSON(statusCode, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      errorCode,
				Message:   err.Error(),
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("Password changed successfully for user: %s", userIDStr)

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"message": "Password changed successfully",
		},
		RequestID: c.GetString("requestID"),
	})
}

// LogoutAllDevices handles logout from all devices
func LogoutAllDevices(c *gin.Context) {
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

	userIDStr := userID.(string)
	if err := authService.LogoutAllDevices(c.Request.Context(), userIDStr); err != nil {
		log.Printf("Logout all devices failed for user %s: %v", userIDStr, err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "LOGOUT_ALL_FAILED",
				Message:   "Failed to logout from all devices",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("User logged out from all devices: %s", userIDStr)

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"message": "Logged out from all devices successfully",
		},
		RequestID: c.GetString("requestID"),
	})
}

// GetSSOConfig returns the SSO configuration
func GetSSOConfig(c *gin.Context) {
	config := ssoService.GetSSOConfig()
	c.JSON(http.StatusOK, models.ApiResponse{
		Success:   true,
		Data:      config,
		RequestID: c.GetString("requestID"),
	})
}

// InitiateOAuthLogin initiates OAuth login flow
func InitiateOAuthLogin(c *gin.Context) {
	var req models.SSOLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INVALID_REQUEST",
				Message:   "Invalid request format",
				Details:   err.Error(),
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	authURL, err := ssoService.GetOAuthAuthURL(req.Provider, req.State)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "SSO_ERROR",
				Message:   "Failed to generate OAuth URL",
				Details:   err.Error(),
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]string{
			"authUrl": authURL,
		},
		RequestID: c.GetString("requestID"),
	})
}

// HandleOAuthCallback handles OAuth callback
func HandleOAuthCallback(c *gin.Context) {
	var req models.SSOCallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INVALID_REQUEST",
				Message:   "Invalid request format",
				Details:   err.Error(),
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Get organization ID from query params or use default
	organizationID := c.Query("organizationId")

	response, err := ssoService.HandleOAuthCallback(c.Request.Context(), req.Provider, req.Code, req.State, organizationID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "SSO_LOGIN_FAILED",
				Message:   "SSO login failed",
				Details:   err.Error(),
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success:   true,
		Data:      response,
		RequestID: c.GetString("requestID"),
	})
}
