package handlers

import (
	"log"
	"net/http"
	"time"

	"cloudweave/internal/config"
	"cloudweave/internal/models"
	"cloudweave/internal/services"

	"github.com/gin-gonic/gin"
)

var jwtService *services.JWTService

// InitializeJWTService initializes the JWT service with configuration
func InitializeJWTService(cfg *config.Config) {
	jwtService = services.NewJWTService(cfg)
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

// Login handles user authentication
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

	log.Printf("Login request received - Email: %s, Password length: %d", req.Email, len(req.Password))

	// For demo purposes, create a mock user response
	// TODO: Implement actual authentication logic
	if req.Email == "demo@cloudweave.com" && req.Password == "password123" {
		user := models.User{
			ID:             "user-123",
			Email:          req.Email,
			Name:           "Demo User",
			Role:           "admin",
			OrganizationID: "org-123",
			Preferences:    make(map[string]interface{}),
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		// Generate real JWT tokens
		token, err := jwtService.GenerateAccessToken(user)
		if err != nil {
			log.Printf("Error generating access token: %v", err)
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "TOKEN_GENERATION_ERROR",
					Message:   "Failed to generate access token",
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			return
		}

		refreshToken, err := jwtService.GenerateRefreshToken(user.ID)
		if err != nil {
			log.Printf("Error generating refresh token: %v", err)
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "TOKEN_GENERATION_ERROR",
					Message:   "Failed to generate refresh token",
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			return
		}

		log.Printf("Login successful for user: %s", req.Email)

		c.JSON(http.StatusOK, models.ApiResponse{
			Success: true,
			Data: models.LoginResponse{
				Success:      true,
				User:         user,
				Token:        token,
				RefreshToken: refreshToken,
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("Login failed for user: %s (invalid credentials)", req.Email)

	c.JSON(http.StatusUnauthorized, models.ApiResponse{
		Success: false,
		Error: &models.ApiError{
			Code:      "LOGIN_FAILED",
			Message:   "Invalid email or password",
			Timestamp: time.Now(),
		},
		RequestID: c.GetString("requestID"),
	})
}

// Register handles user registration
func Register(c *gin.Context) {
	var req models.RegisterRequest
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

	// TODO: Implement actual registration logic
	user := models.User{
		ID:             "user-" + time.Now().Format("20060102150405"),
		Email:          req.Email,
		Name:           req.Name,
		Role:           "user",
		OrganizationID: req.OrganizationID,
		Preferences:    make(map[string]interface{}),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	token := "demo-jwt-token"
	refreshToken := "demo-refresh-token"

	c.JSON(http.StatusCreated, models.ApiResponse{
		Success: true,
		Data: models.RegisterResponse{
			Success:      true,
			User:         user,
			Token:        token,
			RefreshToken: refreshToken,
		},
		RequestID: c.GetString("requestID"),
	})
}

// RefreshToken handles token refresh
func RefreshToken(c *gin.Context) {
	var req models.RefreshTokenRequest
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

	// Validate the refresh token
	claims, err := jwtService.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		log.Printf("Invalid refresh token: %v", err)
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INVALID_REFRESH_TOKEN",
				Message:   "Invalid or expired refresh token",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// For demo purposes, recreate the user from token claims
	// TODO: Fetch user from database using claims.UserID
	user := models.User{
		ID:             claims.UserID,
		Email:          "demo@cloudweave.com", // TODO: Get from database
		Name:           "Demo User",            // TODO: Get from database
		Role:           "admin",                // TODO: Get from database
		OrganizationID: "org-123",             // TODO: Get from database
		Preferences:    make(map[string]interface{}),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	// Generate new tokens
	newAccessToken, err := jwtService.GenerateAccessToken(user)
	if err != nil {
		log.Printf("Error generating new access token: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "TOKEN_GENERATION_ERROR",
				Message:   "Failed to generate new access token",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	newRefreshToken, err := jwtService.GenerateRefreshToken(user.ID)
	if err != nil {
		log.Printf("Error generating new refresh token: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "TOKEN_GENERATION_ERROR",
				Message:   "Failed to generate new refresh token",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("Token refresh successful for user: %s", user.ID)

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: models.RefreshTokenResponse{
			Success:      true,
			Token:        newAccessToken,
			RefreshToken: newRefreshToken,
		},
		RequestID: c.GetString("requestID"),
	})
}

// Logout handles user logout
func Logout(c *gin.Context) {
	// TODO: Implement actual logout logic (invalidate tokens)
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
	// TODO: Extract user from JWT token
	user := models.User{
		ID:             "user-123",
		Email:          "demo@cloudweave.com",
		Name:           "Demo User",
		Role:           "admin",
		OrganizationID: "org-123",
		Preferences:    make(map[string]interface{}),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"user": user,
		},
		RequestID: c.GetString("requestID"),
	})
}