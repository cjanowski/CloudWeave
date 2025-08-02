package handlers

import (
	"log"
	"net/http"
	"time"

	"cloudweave/internal/models"

	"github.com/gin-gonic/gin"
)

// GetUserProfile retrieves the current user's profile including onboarding status
// @Summary Get user profile
// @Description Get the current user's profile information including onboarding status
// @Tags User
// @Produce json
// @Success 200 {object} models.ApiResponse
// @Failure 401 {object} models.ApiResponse
// @Failure 500 {object} models.ApiResponse
// @Router /user/profile [get]
func GetUserProfile(c *gin.Context) {
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

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"user": user,
		},
		RequestID: c.GetString("requestID"),
	})
}