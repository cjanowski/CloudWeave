package handlers

import (
	"fmt"
	"net/http"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/services"

	"github.com/gin-gonic/gin"
)

type DemoDataHandler struct {
	demoDataService *services.DemoDataService
	authService     *services.AuthService
}

func NewDemoDataHandler(demoDataService *services.DemoDataService, authService *services.AuthService) *DemoDataHandler {
	return &DemoDataHandler{
		demoDataService: demoDataService,
		authService:     authService,
	}
}

// InitializeDemoData initializes demo data for a user
// @Summary Initialize demo data
// @Description Initialize demo data for a user based on the specified scenario
// @Tags Demo
// @Accept json
// @Produce json
// @Param request body models.InitializeDemoRequest true "Demo initialization request"
// @Success 200 {object} models.ApiResponse
// @Failure 400 {object} models.ApiResponse
// @Failure 401 {object} models.ApiResponse
// @Failure 500 {object} models.ApiResponse
// @Router /user/initialize-demo [post]
func (h *DemoDataHandler) InitializeDemoData(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	var req models.InitializeDemoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request format",
				Details: err.Error(),
			},
		})
		return
	}

	// Initialize demo data
	if err := h.demoDataService.InitializeDemoData(c.Request.Context(), userID, req.Scenario); err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "DEMO_INIT_FAILED",
				Message: "Failed to initialize demo data",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"message":  "Demo data initialized successfully",
			"scenario": req.Scenario,
		},
	})
}

// GetDemoInfrastructure retrieves demo infrastructure data
// @Summary Get demo infrastructure
// @Description Get demo infrastructure data for the authenticated user
// @Tags Demo
// @Produce json
// @Success 200 {object} models.ApiResponse
// @Failure 401 {object} models.ApiResponse
// @Failure 500 {object} models.ApiResponse
// @Router /demo/infrastructure [get]
func (h *DemoDataHandler) GetDemoInfrastructure(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	infrastructure, err := h.demoDataService.GetDemoInfrastructure(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "DEMO_DATA_ERROR",
				Message: "Failed to retrieve demo infrastructure",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    infrastructure,
	})
}

// GetDemoDeployments retrieves demo deployment data
// @Summary Get demo deployments
// @Description Get demo deployment data for the authenticated user
// @Tags Demo
// @Produce json
// @Success 200 {object} models.ApiResponse
// @Failure 401 {object} models.ApiResponse
// @Failure 500 {object} models.ApiResponse
// @Router /demo/deployments [get]
func (h *DemoDataHandler) GetDemoDeployments(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	deployments, err := h.demoDataService.GetDemoDeployments(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "DEMO_DATA_ERROR",
				Message: "Failed to retrieve demo deployments",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    deployments,
	})
}

// GetDemoMetrics retrieves demo metrics data
// @Summary Get demo metrics
// @Description Get demo metrics data for the authenticated user
// @Tags Demo
// @Produce json
// @Param start query string false "Start time (RFC3339 format)"
// @Param end query string false "End time (RFC3339 format)"
// @Success 200 {object} models.ApiResponse
// @Failure 401 {object} models.ApiResponse
// @Failure 500 {object} models.ApiResponse
// @Router /demo/metrics [get]
func (h *DemoDataHandler) GetDemoMetrics(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	// Parse time range parameters
	timeRange := services.TimeRange{}
	if startStr := c.Query("start"); startStr != "" {
		if start, err := time.Parse(time.RFC3339, startStr); err == nil {
			timeRange.Start = start
		}
	}
	if endStr := c.Query("end"); endStr != "" {
		if end, err := time.Parse(time.RFC3339, endStr); err == nil {
			timeRange.End = end
		}
	}

	metrics, err := h.demoDataService.GetDemoMetrics(c.Request.Context(), userID, timeRange)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "DEMO_DATA_ERROR",
				Message: "Failed to retrieve demo metrics",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    metrics,
	})
}

// GetDemoAlerts retrieves demo alert data
// @Summary Get demo alerts
// @Description Get demo alert data for the authenticated user
// @Tags Demo
// @Produce json
// @Success 200 {object} models.ApiResponse
// @Failure 401 {object} models.ApiResponse
// @Failure 500 {object} models.ApiResponse
// @Router /demo/alerts [get]
func (h *DemoDataHandler) GetDemoAlerts(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	alerts, err := h.demoDataService.GetDemoAlerts(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "DEMO_DATA_ERROR",
				Message: "Failed to retrieve demo alerts",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    alerts,
	})
}

// GetDemoCostData retrieves demo cost data
// @Summary Get demo cost data
// @Description Get demo cost data for the authenticated user
// @Tags Demo
// @Produce json
// @Success 200 {object} models.ApiResponse
// @Failure 401 {object} models.ApiResponse
// @Failure 500 {object} models.ApiResponse
// @Router /demo/cost [get]
func (h *DemoDataHandler) GetDemoCostData(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	costData, err := h.demoDataService.GetDemoCostData(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "DEMO_DATA_ERROR",
				Message: "Failed to retrieve demo cost data",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    costData,
	})
}

// CompleteOnboarding completes the user onboarding process
// @Summary Complete onboarding
// @Description Complete the user onboarding process and optionally initialize demo data
// @Tags Demo
// @Accept json
// @Produce json
// @Param request body models.CompleteOnboardingRequest true "Onboarding completion request"
// @Success 200 {object} models.ApiResponse
// @Failure 400 {object} models.ApiResponse
// @Failure 401 {object} models.ApiResponse
// @Failure 500 {object} models.ApiResponse
// @Router /user/complete-onboarding [post]
func (h *DemoDataHandler) CompleteOnboarding(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	var req models.CompleteOnboardingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request format",
				Details: err.Error(),
			},
		})
		return
	}

	// Update user preferences if provided
	if req.Preferences != nil {
		if err := h.authService.UpdateUserPreferences(c.Request.Context(), userID, req.Preferences); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:    "PREFERENCES_UPDATE_FAILED",
					Message: "Failed to update user preferences",
					Details: err.Error(),
				},
			})
			return
		}
	}

	// Initialize demo data if demo mode is enabled
	if req.DemoMode {
		if err := h.demoDataService.InitializeDemoData(c.Request.Context(), userID, models.DemoScenarioStartup); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error: &models.ApiError{
					Code:    "DEMO_INIT_FAILED",
					Message: "Failed to initialize demo data",
					Details: err.Error(),
				},
			})
			return
		}
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"message":  "Onboarding completed successfully",
			"demoMode": req.DemoMode,
		},
	})
}

// TransitionToReal transitions a user from demo mode to real data
// @Summary Transition to real data
// @Description Transition a user from demo mode to real data
// @Tags Demo
// @Accept json
// @Produce json
// @Param request body models.TransitionToRealRequest true "Transition request"
// @Success 200 {object} models.ApiResponse
// @Failure 400 {object} models.ApiResponse
// @Failure 401 {object} models.ApiResponse
// @Failure 500 {object} models.ApiResponse
// @Router /user/transition-to-real [post]
func (h *DemoDataHandler) TransitionToReal(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	var req models.TransitionToRealRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request format",
				Details: err.Error(),
			},
		})
		return
	}

	// Transition to real data
	if err := h.demoDataService.TransitionToReal(c.Request.Context(), userID, req.KeepSettings); err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:    "TRANSITION_FAILED",
				Message: "Failed to transition to real data",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"message":        "Successfully transitioned to real data",
			"keepSettings":   req.KeepSettings,
			"cloudProviders": req.CloudProviders,
		},
	})
}

// parseTimeParam parses a time parameter from a string
func parseTimeParam(timeStr string) (time.Time, error) {
	// Try RFC3339 format first
	if t, err := time.Parse(time.RFC3339, timeStr); err == nil {
		return t, nil
	}
	
	// Try other common formats
	formats := []string{
		"2006-01-02T15:04:05Z",
		"2006-01-02 15:04:05",
		"2006-01-02",
	}
	
	for _, format := range formats {
		if t, err := time.Parse(format, timeStr); err == nil {
			return t, nil
		}
	}
	
	return time.Time{}, fmt.Errorf("unable to parse time: %s", timeStr)
}