package services

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// WebSocketService handles real-time communication
type WebSocketService struct {
	clients    map[*Client]bool
	broadcast  chan *WebSocketMessage
	register   chan *Client
	unregister chan *Client
	mutex      sync.RWMutex
}

// Client represents a WebSocket client connection
type Client struct {
	ID       string
	UserID   string
	Conn     *websocket.Conn
	Send     chan []byte
	Service  *WebSocketService
	UserType string // "user", "system", etc.
}

// WebSocketMessage represents a message sent through WebSocket
type WebSocketMessage struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data"`
	Timestamp string      `json:"timestamp"`
	ID        string      `json:"id,omitempty"`
	UserID    string      `json:"userId,omitempty"`
	Target    string      `json:"target,omitempty"` // "all", "user", "organization"
}

// Message types
const (
	MessageTypeDeploymentStatus = "deployment_status"
	MessageTypeInfrastructure   = "infrastructure_update"
	MessageTypeMetrics          = "metrics_update"
	MessageTypeAlert            = "alert_notification"
	MessageTypeSystem           = "system_message"
	MessageTypeError            = "error"
	MessageTypePing             = "ping"
	MessageTypePong             = "pong"
)

// NewWebSocketService creates a new WebSocket service
func NewWebSocketService() *WebSocketService {
	return &WebSocketService{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan *WebSocketMessage, 100),
		register:   make(chan *Client, 10),
		unregister: make(chan *Client, 10),
	}
}

// Start starts the WebSocket service
func (ws *WebSocketService) Start() {
	log.Println("Starting WebSocket service...")

	for {
		select {
		case client := <-ws.register:
			ws.mutex.Lock()
			ws.clients[client] = true
			ws.mutex.Unlock()
			log.Printf("Client registered: %s (User: %s)", client.ID, client.UserID)

			// Send welcome message
			welcomeMsg := &WebSocketMessage{
				Type:      MessageTypeSystem,
				Data:      map[string]string{"message": "Connected to CloudWeave real-time service"},
				Timestamp: time.Now().UTC().Format(time.RFC3339),
				ID:        client.ID,
			}
			client.Send <- ws.marshalMessage(welcomeMsg)

		case client := <-ws.unregister:
			ws.mutex.Lock()
			if _, ok := ws.clients[client]; ok {
				delete(ws.clients, client)
				close(client.Send)
			}
			ws.mutex.Unlock()
			log.Printf("Client unregistered: %s", client.ID)

		case message := <-ws.broadcast:
			ws.mutex.RLock()
			for client := range ws.clients {
				// Check if message should be sent to this client
				if ws.shouldSendToClient(message, client) {
					select {
					case client.Send <- ws.marshalMessage(message):
					default:
						close(client.Send)
						delete(ws.clients, client)
					}
				}
			}
			ws.mutex.RUnlock()
		}
	}
}

// shouldSendToClient determines if a message should be sent to a specific client
func (ws *WebSocketService) shouldSendToClient(message *WebSocketMessage, client *Client) bool {
	// System messages go to all clients
	if message.Type == MessageTypeSystem {
		return true
	}

	// User-specific messages
	if message.UserID != "" && message.UserID == client.UserID {
		return true
	}

	// Broadcast messages
	if message.Target == "all" {
		return true
	}

	// Organization-specific messages (future implementation)
	// if message.Target == "organization" && client.OrganizationID == message.OrganizationID {
	//     return true
	// }

	return false
}

// marshalMessage converts a WebSocketMessage to JSON bytes
func (ws *WebSocketService) marshalMessage(message *WebSocketMessage) []byte {
	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling WebSocket message: %v", err)
		return []byte(`{"type":"error","data":{"message":"Internal server error"},"timestamp":"` + time.Now().UTC().Format(time.RFC3339) + `"}`)
	}
	return data
}

// BroadcastMessage sends a message to all connected clients
func (ws *WebSocketService) BroadcastMessage(messageType string, data interface{}) {
	message := &WebSocketMessage{
		Type:      messageType,
		Data:      data,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Target:    "all",
	}
	ws.broadcast <- message
}

// SendToUser sends a message to a specific user
func (ws *WebSocketService) SendToUser(userID, messageType string, data interface{}) {
	message := &WebSocketMessage{
		Type:      messageType,
		Data:      data,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		UserID:    userID,
	}
	ws.broadcast <- message
}

// SendDeploymentStatus sends deployment status updates
func (ws *WebSocketService) SendDeploymentStatus(userID string, deploymentID string, status string, progress int, message string) {
	data := map[string]interface{}{
		"deploymentId": deploymentID,
		"status":       status,
		"progress":     progress,
		"message":      message,
	}
	ws.SendToUser(userID, MessageTypeDeploymentStatus, data)
}

// SendInfrastructureUpdate sends infrastructure status updates
func (ws *WebSocketService) SendInfrastructureUpdate(userID string, infrastructureID string, status string, message string) {
	data := map[string]interface{}{
		"infrastructureId": infrastructureID,
		"status":           status,
		"message":          message,
	}
	ws.SendToUser(userID, MessageTypeInfrastructure, data)
}

// SendMetricsUpdate sends real-time metrics updates
func (ws *WebSocketService) SendMetricsUpdate(userID string, metrics map[string]interface{}) {
	ws.SendToUser(userID, MessageTypeMetrics, metrics)
}

// SendAlert sends alert notifications
func (ws *WebSocketService) SendAlert(userID string, alert map[string]interface{}) {
	ws.SendToUser(userID, MessageTypeAlert, alert)
}

// GetConnectedClientsCount returns the number of connected clients
func (ws *WebSocketService) GetConnectedClientsCount() int {
	ws.mutex.RLock()
	defer ws.mutex.RUnlock()
	return len(ws.clients)
}

// HandleWebSocket handles the WebSocket upgrade and client connection
func (ws *WebSocketService) HandleWebSocket(w http.ResponseWriter, r *http.Request, userID string) {
	// Configure WebSocket upgrader
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			// Allow connections from frontend origins
			origin := r.Header.Get("Origin")
			return origin == "http://localhost:5173" ||
				origin == "http://localhost:5176" ||
				origin == "http://localhost:3000" ||
				origin == "" // Allow empty origin for testing
		},
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	// Create new client
	client := &Client{
		ID:       generateClientID(),
		UserID:   userID,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		Service:  ws,
		UserType: "user",
	}

	// Register client
	ws.register <- client

	// Start goroutines for reading and writing
	go client.readPump()
	go client.writePump()
}

// readPump handles reading messages from the WebSocket connection
func (c *Client) readPump() {
	defer func() {
		c.Service.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(512) // 512 bytes max message size
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}

		// Handle incoming messages
		c.handleIncomingMessage(message)
	}
}

// writePump handles writing messages to the WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleIncomingMessage processes incoming WebSocket messages
func (c *Client) handleIncomingMessage(message []byte) {
	var msg WebSocketMessage
	if err := json.Unmarshal(message, &msg); err != nil {
		log.Printf("Error unmarshaling message: %v", err)
		return
	}

	switch msg.Type {
	case MessageTypePing:
		// Respond with pong
		pongMsg := &WebSocketMessage{
			Type:      MessageTypePong,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		}
		c.Send <- c.Service.marshalMessage(pongMsg)

	case MessageTypePong:
		// Handle pong response
		log.Printf("Received pong from client %s", c.ID)

	default:
		log.Printf("Received message from client %s: %s", c.ID, msg.Type)
	}
}

// generateClientID generates a unique client ID
func generateClientID() string {
	return "client_" + time.Now().Format("20060102150405") + "_" + randomString(8)
}

// randomString generates a random string of specified length
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}
