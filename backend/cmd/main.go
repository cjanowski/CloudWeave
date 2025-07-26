package main

import (
	"log"
	"os"

	"cloudweave/internal/config"
	"cloudweave/internal/handlers"
	"cloudweave/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize JWT service
	handlers.InitializeJWTService(cfg)

	// Set Gin mode
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create router
	router := gin.Default()

	// CORS middleware
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:5173", "http://localhost:5176", "http://localhost:3000"}
	corsConfig.AllowCredentials = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization", "X-Request-ID"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	router.Use(cors.New(corsConfig))

	// Custom middleware
	router.Use(middleware.RequestID())
	router.Use(middleware.Logger())
	router.Use(middleware.ErrorHandler())

	// API routes
	api := router.Group("/api/v1")
	{
		// Health check
		api.GET("/health", handlers.HealthCheck)

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", handlers.Login)
			auth.POST("/register", handlers.Register)
			auth.POST("/refresh", handlers.RefreshToken)
			auth.POST("/logout", handlers.Logout)
			auth.GET("/me", middleware.AuthRequired(), handlers.GetCurrentUser)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthRequired())
		{
			// Add other protected routes here
		}
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	log.Printf("Starting CloudWeave server on port %s", port)
	log.Printf("Environment: %s", cfg.Environment)
	
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}