package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"cloudweave/internal/config"
	"cloudweave/internal/database"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Parse command line flags
	var (
		action = flag.String("action", "up", "Migration action: up, down, version, force")
		steps  = flag.Int("steps", 1, "Number of migration steps (for down action)")
		version = flag.Uint("version", 0, "Force migration to specific version")
	)
	flag.Parse()

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

	switch *action {
	case "up":
		fmt.Println("Running migrations...")
		if err := db.Migrate(); err != nil {
			log.Fatal("Failed to run migrations:", err)
		}
		fmt.Println("Migrations completed successfully")

	case "down":
		fmt.Printf("Rolling back %d migration(s)...\n", *steps)
		for i := 0; i < *steps; i++ {
			if err := db.MigrateDown(); err != nil {
				log.Fatal("Failed to rollback migration:", err)
			}
		}
		fmt.Printf("Rolled back %d migration(s) successfully\n", *steps)

	case "version":
		version, dirty, err := db.GetVersion()
		if err != nil {
			log.Fatal("Failed to get migration version:", err)
		}
		fmt.Printf("Current migration version: %d\n", version)
		if dirty {
			fmt.Println("Warning: Migration state is dirty")
		}

	case "force":
		if *version == 0 {
			log.Fatal("Version must be specified for force action")
		}
		fmt.Printf("Forcing migration to version %d...\n", *version)
		// Note: This is a dangerous operation and should be used carefully
		fmt.Println("Force migration is not implemented for safety reasons")
		fmt.Println("Please use the migrate CLI tool directly if needed")

	default:
		fmt.Printf("Unknown action: %s\n", *action)
		fmt.Println("Available actions: up, down, version, force")
		os.Exit(1)
	}
}