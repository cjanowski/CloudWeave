package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

type Database struct {
	DB       *sql.DB
	migrator *migrate.Migrate
}

type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// NewDatabase creates a new database connection with migration support
func NewDatabase(config Config) (*Database, error) {
	// Build connection string
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		config.Host, config.Port, config.User, config.Password, config.DBName, config.SSLMode)

	// Open database connection
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Setup migrator
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to create postgres driver: %w", err)
	}

	migrator, err := migrate.NewWithDatabaseInstance(
		"file://./migrations",
		"postgres",
		driver,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create migrator: %w", err)
	}

	return &Database{
		DB:       db,
		migrator: migrator,
	}, nil
}

// Migrate runs all pending migrations
func (d *Database) Migrate() error {
	if err := d.migrator.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to run migrations: %w", err)
	}
	log.Println("Database migrations completed successfully")
	return nil
}

// MigrateDown rolls back the last migration
func (d *Database) MigrateDown() error {
	if err := d.migrator.Steps(-1); err != nil {
		return fmt.Errorf("failed to rollback migration: %w", err)
	}
	log.Println("Migration rolled back successfully")
	return nil
}

// GetVersion returns the current migration version
func (d *Database) GetVersion() (uint, bool, error) {
	return d.migrator.Version()
}

// Close closes the database connection
func (d *Database) Close() error {
	if d.migrator != nil {
		if sourceErr, dbErr := d.migrator.Close(); sourceErr != nil || dbErr != nil {
			log.Printf("Error closing migrator - source: %v, db: %v", sourceErr, dbErr)
		}
	}
	if d.DB != nil {
		return d.DB.Close()
	}
	return nil
}

// Health checks database connectivity
func (d *Database) Health() error {
	return d.DB.Ping()
}