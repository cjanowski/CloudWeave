package main

import (
	"log"
	"os"

	"cloudweave/internal/config"
	"cloudweave/internal/database"
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

	// Initialize database
	dbConfig := database.Config{
		Host:     cfg.DatabaseHost,
		Port:     cfg.DatabasePort,
		User:     cfg.DatabaseUser,
		Password: cfg.DatabasePassword,
		DBName:   cfg.DatabaseName,
		SSLMode:  cfg.DatabaseSSLMode,
	}

	db, err := database.NewDatabase(dbConfig)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Run database migrations
	if err := db.Migrate(); err != nil {
		log.Fatal("Failed to run database migrations:", err)
	}

	// Initialize authentication services
	handlers.InitializeAuthServices(cfg, db)

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
		api.GET("/health", handlers.HealthCheckWithDB(db))

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", handlers.Login)
			auth.POST("/register", handlers.Register)
			auth.POST("/refresh", handlers.RefreshToken)
			auth.POST("/logout", handlers.Logout)
			auth.GET("/me", middleware.AuthRequired(handlers.GetJWTService()), handlers.GetCurrentUser)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthRequired(handlers.GetJWTService()))
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