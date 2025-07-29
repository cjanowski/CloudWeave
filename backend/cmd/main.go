package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"cloudweave/docs"
	"cloudweave/internal/config"
	"cloudweave/internal/database"
	"cloudweave/internal/handlers"
	"cloudweave/internal/middleware"
	"cloudweave/internal/repositories"
	"cloudweave/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	ginSwagger "github.com/swaggo/gin-swagger"
	swaggerFiles "github.com/swaggo/files"
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
	wsService := services.NewWebSocketService()
	infraService := services.NewInfrastructureService(repoManager)
	deploymentService := services.NewDeploymentService(repoManager, wsService)

	// Initialize metrics and alerts services with cloud providers from infrastructure service
	providers := infraService.GetProviders()
	metricsService := services.NewMetricsService(repoManager, providers)
	alertService := services.NewAlertService(repoManager)
	costService := services.NewCostManagementService(repoManager, providers)
	securityService := services.NewSecurityService(repoManager.SecurityScan, repoManager.Vulnerability, repoManager.AuditLog)
	complianceService := services.NewComplianceService(repoManager.ComplianceFramework, repoManager.ComplianceControl, repoManager.ComplianceAssessment, repoManager.AuditLog, repoManager.Transaction)
	rbacService := services.NewRBACService(repoManager.Role, repoManager.UserRole, repoManager.ResourcePermission, repoManager.APIKey, repoManager.Session, repoManager.AuditLog, repoManager.Transaction)
	auditService := services.NewAuditService(repoManager.AuditLog)

	log.Println("WebSocket service initialized successfully")
	log.Println("Metrics and alerts services initialized successfully")

	// Initialize authentication services
	handlers.InitializeAuthServices(cfg, db, auditService)

	// Initialize security service
	handlers.InitializeSecurityService(securityService)

	// Initialize cloud credentials service
	cloudCredentialsService := services.NewCloudCredentialsService(repoManager.CloudCredentials, repoManager.Organization)
	handlers.InitializeCloudCredentialsService(cloudCredentialsService)

	// Start WebSocket service in background
	go wsService.Start()

	// Set Gin mode
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create router
	router := gin.Default()
	
	// Register custom validators
	middleware.RegisterCustomValidators()

	// CORS middleware
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:5176", "http://localhost:3000"}
	corsConfig.AllowCredentials = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization", "X-Request-ID"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	router.Use(cors.New(corsConfig))

	// Security middleware
	router.Use(middleware.SecurityHeaders())
	router.Use(middleware.RequestSizeLimit(10 * 1024 * 1024)) // 10MB limit
	router.Use(middleware.RateLimitMiddleware(100, time.Minute)) // 100 requests per minute

	// Core middleware
	router.Use(middleware.RequestID())
	router.Use(middleware.Logger())
	router.Use(middleware.ProductionErrorHandler())
	router.Use(middleware.ErrorHandler())

	// Swagger documentation
	docs.SwaggerInfo.Host = "localhost:" + func() string {
		if port := os.Getenv("PORT"); port != "" {
			return port
		}
		return "3001"
	}()
	
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	router.GET("/api/info", handlers.SwaggerInfo)

	// API routes
	api := router.Group("/api/v1")
	{
		// Health check
		api.GET("/health", middleware.HealthCheckMiddleware(), handlers.HealthCheckWithDB(db))
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

		// WebSocket routes
		wsHandler := handlers.NewWebSocketHandler(wsService)
		api.GET("/ws/status", wsHandler.GetWebSocketStatus)
		api.GET("/ws", middleware.WebSocketAuthRequired(handlers.GetJWTService()), wsHandler.HandleWebSocket)

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", handlers.Login)
			auth.POST("/register", handlers.Register)
			auth.POST("/refresh", handlers.RefreshToken)
			auth.POST("/logout", handlers.Logout)
			auth.GET("/me", middleware.AuthRequired(handlers.GetJWTService()), handlers.GetCurrentUser)

			// SSO routes
			sso := auth.Group("/sso")
			{
				sso.GET("/config", handlers.GetSSOConfig)
				sso.POST("/oauth/login", handlers.InitiateOAuthLogin)
				sso.POST("/oauth/callback", handlers.HandleOAuthCallback)
			}
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthRequired(handlers.GetJWTService()))
		protected.Use(middleware.AuditLog(auditService))
		{
			// Dashboard routes
			dashboardHandler := handlers.NewDashboardHandler(repoManager, metricsService, alertService)
			dashboard := protected.Group("/dashboard")
			{
				dashboard.GET("/overview", dashboardHandler.GetDashboardOverview)
				dashboard.GET("/stats", dashboardHandler.GetDashboardStats)
				dashboard.GET("/activity", dashboardHandler.GetDashboardActivity)
				dashboard.GET("/performance", dashboardHandler.GetPerformanceMetrics)
				dashboard.GET("/costs", dashboardHandler.GetCostMetrics)
				dashboard.GET("/security", dashboardHandler.GetSecurityMetrics)
				dashboard.GET("/infrastructure", dashboardHandler.GetInfrastructureMetrics)
				dashboard.GET("/reports", dashboardHandler.GetReportsMetrics)
			}

			// Infrastructure routes
			infraHandler := handlers.NewInfrastructureHandler(repoManager, infraService)
			infrastructure := protected.Group("/infrastructure")
			{
				infrastructure.GET("/providers", infraHandler.GetProviders)
				infrastructure.POST("/", infraHandler.CreateInfrastructure)
				infrastructure.GET("/", 
					middleware.ValidateQuery(map[string]string{
						"page": "numeric",
						"limit": "numeric",
						"provider": "alpha",
						"status": "alpha",
					}),
					infraHandler.ListInfrastructure)
				infrastructure.GET("/:id", 
					middleware.ValidatePathParams(map[string]string{"id": "uuid"}),
					infraHandler.GetInfrastructure)
				infrastructure.PUT("/:id", 
					middleware.ValidatePathParams(map[string]string{"id": "uuid"}),
					infraHandler.UpdateInfrastructure)
				infrastructure.DELETE("/:id", 
					middleware.ValidatePathParams(map[string]string{"id": "uuid"}),
					infraHandler.DeleteInfrastructure)
				infrastructure.GET("/:id/metrics", 
					middleware.ValidatePathParams(map[string]string{"id": "uuid"}),
					infraHandler.GetInfrastructureMetrics)
				infrastructure.POST("/:id/sync", 
					middleware.ValidatePathParams(map[string]string{"id": "uuid"}),
					infraHandler.SyncInfrastructure)
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

			// Metrics routes
			metricsHandler := handlers.NewMetricsHandler(metricsService)
			metrics := protected.Group("/metrics")
			{
				metrics.GET("/dashboard", metricsHandler.GetDashboardMetrics)
				metrics.GET("/aggregated", metricsHandler.GetAggregatedMetrics)
				metrics.GET("/definitions", metricsHandler.GetMetricDefinitions)
				metrics.GET("/resources/:id", metricsHandler.GetResourceMetrics)
				metrics.POST("/collect", metricsHandler.CollectMetrics)
				metrics.GET("/stream", metricsHandler.StreamMetrics)
			}

			// Alerts routes
			alertsHandler := handlers.NewAlertsHandler(alertService)
			alerts := protected.Group("/alerts")
			{
				alerts.GET("/", alertsHandler.GetAlerts)
				alerts.GET("/active", alertsHandler.GetActiveAlerts)
				alerts.GET("/summary", alertsHandler.GetAlertSummary)
				alerts.POST("/:id/acknowledge", alertsHandler.AcknowledgeAlert)
				alerts.PUT("/:id/status", alertsHandler.UpdateAlertStatus)
				alerts.POST("/rules", alertsHandler.CreateAlertRule)
			}

			// Cost Management routes
			costHandler := handlers.NewCostManagementHandler(repoManager, costService)
			costs := protected.Group("/costs")
			{
				costs.GET("/overview", costHandler.GetCostOverview)
				costs.GET("/breakdown", costHandler.GetCostBreakdown)
				costs.GET("/optimization", costHandler.GetCostOptimization)
				costs.GET("/billing", costHandler.GetBillingHistory)
				costs.GET("/alerts", costHandler.GetBudgetAlerts)
				costs.POST("/by-tags", costHandler.GetCostByTags)
				costs.GET("/real-time", costHandler.GetRealTimeCostMonitoring)
				costs.GET("/allocation", costHandler.GetCostAllocationByTags)
				costs.GET("/recommendations", costHandler.GetCostOptimizationRecommendations)
				costs.POST("/budgets", costHandler.CreateBudget)
				costs.GET("/budgets", costHandler.GetBudgets)
			}

			// Security routes
			security := protected.Group("/security")
			{
				security.POST("/scans", handlers.CreateSecurityScan)
				security.GET("/scans", handlers.ListSecurityScans)
				security.GET("/scans/:id", handlers.GetSecurityScan)
				security.GET("/vulnerabilities", handlers.GetVulnerabilities)
				security.GET("/vulnerabilities/:id", handlers.GetVulnerability)
				security.PUT("/vulnerabilities/:id", handlers.UpdateVulnerability)
				security.GET("/metrics", handlers.GetSecurityMetrics)
			}

			// Compliance routes
			complianceHandler := handlers.NewComplianceGinHandler(complianceService)
			compliance := protected.Group("/compliance")
			{
				// Framework routes
				compliance.POST("/frameworks", complianceHandler.CreateFramework)
				compliance.GET("/frameworks", complianceHandler.ListFrameworks)
				compliance.GET("/frameworks/:id", complianceHandler.GetFramework)
				compliance.PUT("/frameworks/:id", complianceHandler.UpdateFramework)
				compliance.DELETE("/frameworks/:id", complianceHandler.DeleteFramework)
				compliance.GET("/frameworks/:id/statistics", complianceHandler.GetControlStatistics)

				// Assessment routes
				compliance.POST("/assessments", complianceHandler.CreateAssessment)
				compliance.GET("/assessments", complianceHandler.ListAssessments)
				compliance.POST("/assessments/:id/run", complianceHandler.RunAssessment)
			}

			// RBAC routes
			rbacHandler := handlers.NewRBACGinHandler(rbacService)
			rbac := protected.Group("/rbac")
			{
				// Role management routes
				rbac.POST("/roles", rbacHandler.CreateRole)
				rbac.GET("/roles", rbacHandler.ListRoles)
				rbac.GET("/roles/:id", rbacHandler.GetRole)
				rbac.PUT("/roles/:id", rbacHandler.UpdateRole)
				rbac.DELETE("/roles/:id", rbacHandler.DeleteRole)

				// User role assignment routes
				rbac.POST("/users/:userId/roles", rbacHandler.AssignRole)
				rbac.DELETE("/users/:userId/roles/:roleId", rbacHandler.RemoveRole)
				rbac.GET("/users/:userId/roles", rbacHandler.GetUserRoles)
				rbac.GET("/users/:userId/permissions", rbacHandler.GetUserPermissions)

				// Permission checking routes
				rbac.POST("/check-permission", rbacHandler.CheckPermission)

				// API key management routes
				rbac.POST("/api-keys", rbacHandler.CreateAPIKey)
				rbac.GET("/api-keys", rbacHandler.ListAPIKeys)

				// System routes
				rbac.POST("/system/initialize", rbacHandler.InitializeSystemRoles)
			}

			// Cloud credentials routes
			cloudCredentials := protected.Group("/cloud-credentials")
			{
				cloudCredentials.GET("/", handlers.GetCloudCredentials)
				cloudCredentials.DELETE("/:id", handlers.DeleteCloudCredentials)

				// AWS specific routes
				aws := cloudCredentials.Group("/aws")
				{
					aws.POST("/root", handlers.SetupAWSRootCredentials)
					aws.POST("/access-key", handlers.SetupAWSAccessKey)
					aws.POST("/test", handlers.TestAWSConnection)
				}
			}

			// Audit routes
			auditHandler := handlers.NewAuditHandler(auditService)
			audit := protected.Group("/audit")
			{
				audit.GET("/", auditHandler.GetAuditLogs)
				audit.GET("/compliance-report", auditHandler.GetComplianceReport)
				audit.GET("/export", auditHandler.ExportAuditLogs)
				audit.POST("/cleanup", auditHandler.CleanupOldLogs)
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
