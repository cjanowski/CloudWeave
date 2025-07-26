package main

import (
	"log"
	"net/http"
	"os"

	"cloudweave/internal/config"
	"cloudweave/internal/database"
	"cloudweave/internal/handlers"
	"cloudweave/internal/middleware"
	"cloudweave/internal/repositories"
	"cloudweave/internal/services"

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

	log.Printf("DEBUG: Connecting to database: host=%s port=%s user=%s dbname=%s sslmode=%s", 
		cfg.DatabaseHost, cfg.DatabasePort, cfg.DatabaseUser, cfg.DatabaseName, cfg.DatabaseSSLMode)

	db, err := database.NewDatabase(dbConfig)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Skip Go migrations - database already has schema from Knex migrations
	log.Println("Skipping Go migrations - using existing Knex schema")

	// Initialize repository manager
	repoManager := repositories.NewRepositoryManager(db.DB)
	log.Println("Repository layer initialized successfully")

	// Initialize services
	infraService := services.NewInfrastructureService(repoManager)
	deploymentService := services.NewDeploymentService(repoManager)
	log.Println("Infrastructure service initialized successfully")
	log.Println("Deployment service initialized successfully")

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
		api.GET("/health/repositories", func(c *gin.Context) {
			if err := repoManager.Health(); err != nil {
				c.JSON(http.StatusServiceUnavailable, gin.H{
					"status": "unhealthy",
					"error":  err.Error(),
				})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"status": "healthy",
				"stats":  repoManager.Stats(),
			})
		})

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
			// Infrastructure routes
			infraHandler := handlers.NewInfrastructureHandler(repoManager, infraService)
			infrastructure := protected.Group("/infrastructure")
			{
				infrastructure.GET("/providers", infraHandler.GetProviders)
				infrastructure.POST("/", infraHandler.CreateInfrastructure)
				infrastructure.GET("/", infraHandler.ListInfrastructure)
				infrastructure.GET("/:id", infraHandler.GetInfrastructure)
				infrastructure.PUT("/:id", infraHandler.UpdateInfrastructure)
				infrastructure.DELETE("/:id", infraHandler.DeleteInfrastructure)
				infrastructure.GET("/:id/metrics", infraHandler.GetInfrastructureMetrics)
				infrastructure.POST("/:id/sync", infraHandler.SyncInfrastructure)
			}

			// Deployment routes
			deploymentHandler := handlers.NewDeploymentHandler(repoManager, deploymentService)
			deployments := protected.Group("/deployments")
			{
				deployments.GET("/environments", deploymentHandler.GetEnvironments)
				deployments.POST("/", deploymentHandler.CreateDeployment)
				deployments.GET("/", deploymentHandler.ListDeployments)
				deployments.GET("/history", deploymentHandler.GetDeploymentHistory)
				deployments.GET("/:id", deploymentHandler.GetDeployment)
				deployments.PUT("/:id", deploymentHandler.UpdateDeployment)
				deployments.DELETE("/:id", deploymentHandler.DeleteDeployment)
				deployments.GET("/:id/status", deploymentHandler.GetDeploymentStatus)
				deployments.GET("/:id/logs", deploymentHandler.GetDeploymentLogs)
				deployments.POST("/:id/rollback", deploymentHandler.RollbackDeployment)
				deployments.POST("/:id/cancel", deploymentHandler.CancelDeployment)
			}
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