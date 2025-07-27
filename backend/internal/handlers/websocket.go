package handlers

import (
	"net/http"

	"cloudweave/internal/services"
	"github.com/gin-gonic/gin"
)

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	wsService *services.WebSocketService
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(wsService *services.WebSocketService) *WebSocketHandler {
	return &WebSocketHandler{
		wsService: wsService,
	}
}

// HandleWebSocket handles WebSocket connections with authentication
func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required for WebSocket connection",
		})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user ID format",
		})
		return
	}

	// Handle WebSocket upgrade
	h.wsService.HandleWebSocket(c.Writer, c.Request, userIDStr)
}

// GetWebSocketStatus returns the status of WebSocket service
func (h *WebSocketHandler) GetWebSocketStatus(c *gin.Context) {
	clientCount := h.wsService.GetConnectedClientsCount()
	
	c.JSON(http.StatusOK, gin.H{
		"status": "running",
		"connectedClients": clientCount,
		"message": "WebSocket service is active",
	})
} 