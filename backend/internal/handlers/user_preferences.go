package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"cloudweave/internal/models"

	"github.com/gin-gonic/gin"
)

// UserPreferences represents user preference settings
type UserPreferences struct {
	Theme      string `json:"theme"`
	Language   string `json:"language"`
	Timezone   string `json:"timezone"`
	DateFormat string `json:"dateFormat"`
	Currency   string `json:"currency"`
	Notifications struct {
		Email       bool `json:"email"`
		Push        bool `json:"push"`
		Desktop     bool `json:"desktop"`
		Alerts      bool `json:"alerts"`
		Deployments bool `json:"deployments"`
		CostAlerts  bool `json:"costAlerts"`
		Security    bool `json:"security"`
	} `json:"notifications"`
	Dashboard struct {
		Layout          string `json:"layout"`
		RefreshInterval int    `json:"refreshInterval"`
		DefaultView     string `json:"defaultView"`
		ShowWelcome     bool   `json:"showWelcome"`
	} `json:"dashboard"`
	DefaultCloudProvider string `json:"defaultCloudProvider,omitempty"`
}

// GetUserPreferences retrieves user preferences
func GetUserPreferences(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "UNAUTHORIZED",
				Message:   "User not authenticated",
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

// UpdateUserPreferences updates user preferences
func UpdateUserPreferences(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "UNAUTHORIZED",
				Message:   "User not authenticated",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	var preferences UserPreferences
	if err := c.ShouldBindJSON(&preferences); err != nil {
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
	preferencesJSON, _ := json.Marshal(preferences)
	json.Unmarshal(preferencesJSON, &preferencesMap)

	// In a real implementation, you would save to database
	log.Printf("Updating preferences for user %s: %+v", userID, preferencesMap)

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"preferences": preferences,
			"message":     "Preferences updated successfully",
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
		Notifications: struct {
			Email       bool `json:"email"`
			Push        bool `json:"push"`
			Desktop     bool `json:"desktop"`
			Alerts      bool `json:"alerts"`
			Deployments bool `json:"deployments"`
			CostAlerts  bool `json:"costAlerts"`
			Security    bool `json:"security"`
		}{
			Email:       true,
			Push:        true,
			Desktop:     true,
			Alerts:      true,
			Deployments: true,
			CostAlerts:  true,
			Security:    true,
		},
		Dashboard: struct {
			Layout          string `json:"layout"`
			RefreshInterval int    `json:"refreshInterval"`
			DefaultView     string `json:"defaultView"`
			ShowWelcome     bool   `json:"showWelcome"`
		}{
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
		return fmt.Errorf("invalid theme: %s", prefs.Theme)
	}

	// Validate language
	validLanguages := []string{"en", "es", "fr", "de", "ja", "zh"}
	isValidLanguage := false
	for _, lang := range validLanguages {
		if prefs.Language == lang {
			isValidLanguage = true
			break
		}
	}
	if !isValidLanguage {
		return fmt.Errorf("invalid language: %s", prefs.Language)
	}

	// Validate currency
	validCurrencies := []string{"USD", "EUR", "GBP", "JPY", "CAD", "AUD"}
	isValidCurrency := false
	for _, currency := range validCurrencies {
		if prefs.Currency == currency {
			isValidCurrency = true
			break
		}
	}
	if !isValidCurrency {
		return fmt.Errorf("invalid currency: %s", prefs.Currency)
	}

	// Validate dashboard layout
	validLayouts := []string{"grid", "list"}
	isValidLayout := false
	for _, layout := range validLayouts {
		if prefs.Dashboard.Layout == layout {
			isValidLayout = true
			break
		}
	}
	if !isValidLayout {
		return fmt.Errorf("invalid dashboard layout: %s", prefs.Dashboard.Layout)
	}

	// Validate refresh interval (must be between 30 and 3600 seconds)
	if prefs.Dashboard.RefreshInterval < 30 || prefs.Dashboard.RefreshInterval > 3600 {
		return fmt.Errorf("invalid refresh interval: %d (must be between 30 and 3600 seconds)", prefs.Dashboard.RefreshInterval)
	}

	return nil
}