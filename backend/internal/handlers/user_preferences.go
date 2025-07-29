package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"cloudweave/internal/models"

	"github.com/gin-gonic/gin"
)

// UserPreferences represents user preferences structure
type UserPreferences struct {
	Theme         string                 `json:"theme"`
	Language      string                 `json:"language"`
	Timezone      string                 `json:"timezone"`
	DateFormat    string                 `json:"dateFormat"`
	Currency      string                 `json:"currency"`
	Notifications NotificationPrefs      `json:"notifications"`
	Dashboard     DashboardPrefs         `json:"dashboard"`
	DefaultCloudProvider *string         `json:"defaultCloudProvider,omitempty"`
}

type NotificationPrefs struct {
	Email       bool `json:"email"`
	Push        bool `json:"push"`
	Desktop     bool `json:"desktop"`
	Alerts      bool `json:"alerts"`
	Deployments bool `json:"deployments"`
	CostAlerts  bool `json:"costAlerts"`
	Security    bool `json:"security"`
}

type DashboardPrefs struct {
	Layout          string `json:"layout"`
	RefreshInterval int    `json:"refreshInterval"`
	DefaultView     string `json:"defaultView"`
	ShowWelcome     bool   `json:"showWelcome"`
}

// GetUserPreferences returns the current user's preferences
// @Summary Get user preferences
// @Description Get the current user's preferences and settings
// @Tags User
// @Accept json
// @Produce json
// @Success 200 {object} SuccessResponse{data=UserPreferences}
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /user/preferences [get]
func GetUserPreferences(c *gin.Context) {
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

	// Get user from database
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

	// Parse preferences from user data
	preferences := getDefaultPreferences()
	if user.Preferences != nil {
		if prefsBytes, err := json.Marshal(user.Preferences); err == nil {
			json.Unmarshal(prefsBytes, &preferences)
		}
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"preferences": preferences,
		},
		RequestID: c.GetString("requestID"),
	})
}

// UpdateUserPreferences updates the current user's preferences
// @Summary Update user preferences
// @Description Update the current user's preferences and settings
// @Tags User
// @Accept json
// @Produce json
// @Param request body UserPreferences true "User preferences"
// @Success 200 {object} SuccessResponse{data=UserPreferences}
// @Failure 400 {object} ValidationErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /user/preferences [put]
func UpdateUserPreferences(c *gin.Context) {
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

	var preferences UserPreferences
	if err := c.ShouldBindJSON(&preferences); err != nil {
		log.Printf("User preferences validation error: %v", err)
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

	// Validate preferences
	if err := validatePreferences(&preferences); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INVALID_PREFERENCES",
				Message:   err.Error(),
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// Convert preferences to map for storage
	preferencesMap := make(map[string]interface{})
	if prefsBytes, err := json.Marshal(preferences); err == nil {
		json.Unmarshal(prefsBytes, &preferencesMap)
	}

	// Update user preferences in database
	err := authService.UpdateUserPreferences(c.Request.Context(), userID.(string), preferencesMap)
	if err != nil {
		log.Printf("Failed to update user preferences for %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INTERNAL_ERROR",
				Message:   "Failed to update preferences",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("User preferences updated successfully for user: %s", userID)

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"preferences": preferences,
		},
		RequestID: c.GetString("requestID"),
	})
}

// CompleteOnboarding marks the user's onboarding as completed
// @Summary Complete user onboarding
// @Description Mark the user's onboarding process as completed
// @Tags User
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Onboarding completion data"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ValidationErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /user/complete-onboarding [post]
func CompleteOnboarding(c *gin.Context) {
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
		DemoMode    bool              `json:"demoMode"`
		Preferences *UserPreferences  `json:"preferences,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Complete onboarding validation error: %v", err)
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

	// Update user preferences if provided
	if req.Preferences != nil {
		if err := validatePreferences(req.Preferences); err != nil {
			c.JSON(http.StatusBadRequest, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "INVALID_PREFERENCES",
					Message:   err.Error(),
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			return
		}

		// Convert preferences to map for storage
		preferencesMap := make(map[string]interface{})
		if prefsBytes, err := json.Marshal(req.Preferences); err == nil {
			json.Unmarshal(prefsBytes, &preferencesMap)
		}

		// Add demo mode and onboarding completion to preferences
		preferencesMap["demoMode"] = req.DemoMode
		preferencesMap["onboardingCompleted"] = true

		err := authService.UpdateUserPreferences(c.Request.Context(), userID.(string), preferencesMap)
		if err != nil {
			log.Printf("Failed to update user preferences during onboarding for %s: %v", userID, err)
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "INTERNAL_ERROR",
					Message:   "Failed to complete onboarding",
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			return
		}
	} else {
		// Just mark onboarding as completed
		preferencesMap := map[string]interface{}{
			"demoMode":            req.DemoMode,
			"onboardingCompleted": true,
		}

		err := authService.UpdateUserPreferences(c.Request.Context(), userID.(string), preferencesMap)
		if err != nil {
			log.Printf("Failed to complete onboarding for %s: %v", userID, err)
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:      "INTERNAL_ERROR",
					Message:   "Failed to complete onboarding",
					Timestamp: time.Now(),
				},
				RequestID: c.GetString("requestID"),
			})
			return
		}
	}

	log.Printf("Onboarding completed successfully for user: %s (demo mode: %v)", userID, req.DemoMode)

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"message":            "Onboarding completed successfully",
			"onboardingCompleted": true,
			"demoMode":           req.DemoMode,
		},
		RequestID: c.GetString("requestID"),
	})
}

// InitializeDemoData initializes demo data for the user
// @Summary Initialize demo data
// @Description Initialize demo data for the user based on selected scenario
// @Tags User
// @Accept json
// @Produce json
// @Param request body map[string]string true "Demo scenario"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ValidationErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /user/initialize-demo [post]
func InitializeDemoData(c *gin.Context) {
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
		Scenario string `json:"scenario" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Initialize demo data validation error: %v", err)
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

	// Validate scenario
	validScenarios := []string{"startup", "enterprise", "devops", "multicloud"}
	isValid := false
	for _, scenario := range validScenarios {
		if req.Scenario == scenario {
			isValid = true
			break
		}
	}

	if !isValid {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "INVALID_SCENARIO",
				Message:   "Invalid demo scenario. Must be one of: startup, enterprise, devops, multicloud",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	// TODO: Implement actual demo data initialization based on scenario
	// For now, just log the request
	log.Printf("Demo data initialization requested for user %s with scenario: %s", userID, req.Scenario)

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"message":  "Demo data initialized successfully",
			"scenario": req.Scenario,
		},
		RequestID: c.GetString("requestID"),
	})
}

// Helper functions
func getDefaultPreferences() UserPreferences {
	return UserPreferences{
		Theme:      "system",
		Language:   "en",
		Timezone:   "UTC",
		DateFormat: "MM/DD/YYYY",
		Currency:   "USD",
		Notifications: NotificationPrefs{
			Email:       true,
			Push:        true,
			Desktop:     true,
			Alerts:      true,
			Deployments: true,
			CostAlerts:  true,
			Security:    true,
		},
		Dashboard: DashboardPrefs{
			Layout:          "grid",
			RefreshInterval: 300,
			DefaultView:     "overview",
			ShowWelcome:     true,
		},
	}
}

func validatePreferences(prefs *UserPreferences) error {
	// Validate theme
	validThemes := []string{"light", "dark", "system"}
	isValidTheme := false
	for _, theme := range validThemes {
		if prefs.Theme == theme {
			isValidTheme = true
			break
		}
	}
	if !isValidTheme {
		return &models.ApiError{
			Code:    "INVALID_THEME",
			Message: "Theme must be one of: light, dark, system",
		}
	}

	// Validate layout
	validLayouts := []string{"grid", "list"}
	isValidLayout := false
	for _, layout := range validLayouts {
		if prefs.Dashboard.Layout == layout {
			isValidLayout = true
			break
		}
	}
	if !isValidLayout {
		return &models.ApiError{
			Code:    "INVALID_LAYOUT",
			Message: "Dashboard layout must be one of: grid, list",
		}
	}

	// Validate refresh interval
	if prefs.Dashboard.RefreshInterval < 30 || prefs.Dashboard.RefreshInterval > 3600 {
		return &models.ApiError{
			Code:    "INVALID_REFRESH_INTERVAL",
			Message: "Refresh interval must be between 30 and 3600 seconds",
		}
	}

	return nil
}