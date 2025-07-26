package database

import (
	"testing"
)

func TestDatabaseConfig(t *testing.T) {
	config := Config{
		Host:     "localhost",
		Port:     "5432",
		User:     "postgres",
		Password: "password",
		DBName:   "test_db",
		SSLMode:  "disable",
	}

	// Test that config values are properly set
	if config.Host != "localhost" {
		t.Errorf("Expected host to be 'localhost', got '%s'", config.Host)
	}

	if config.Port != "5432" {
		t.Errorf("Expected port to be '5432', got '%s'", config.Port)
	}

	if config.DBName != "test_db" {
		t.Errorf("Expected database name to be 'test_db', got '%s'", config.DBName)
	}
}

func TestNewDatabase_InvalidConfig(t *testing.T) {
	// Test with invalid configuration
	config := Config{
		Host:     "invalid-host",
		Port:     "invalid-port",
		User:     "invalid-user",
		Password: "invalid-password",
		DBName:   "invalid-db",
		SSLMode:  "disable",
	}

	db, err := NewDatabase(config)
	if err == nil {
		t.Error("Expected error for invalid database configuration, got nil")
		if db != nil {
			db.Close()
		}
	}
}

// Integration test - only runs if PostgreSQL is available
func TestDatabaseConnection_Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	config := Config{
		Host:     "localhost",
		Port:     "5432",
		User:     "postgres",
		Password: "",
		DBName:   "postgres", // Use default postgres database
		SSLMode:  "disable",
	}

	db, err := NewDatabase(config)
	if err != nil {
		t.Skipf("Skipping integration test - PostgreSQL not available: %v", err)
		return
	}
	defer db.Close()

	// Test health check
	if err := db.Health(); err != nil {
		t.Errorf("Database health check failed: %v", err)
	}

	// Test that database connection is working
	var result int
	err = db.DB.QueryRow("SELECT 1").Scan(&result)
	if err != nil {
		t.Errorf("Failed to execute test query: %v", err)
	}

	if result != 1 {
		t.Errorf("Expected query result to be 1, got %d", result)
	}
}

func TestDatabaseClose(t *testing.T) {
	config := Config{
		Host:     "localhost",
		Port:     "5432",
		User:     "postgres",
		Password: "",
		DBName:   "postgres",
		SSLMode:  "disable",
	}

	db, err := NewDatabase(config)
	if err != nil {
		t.Skipf("Skipping test - PostgreSQL not available: %v", err)
		return
	}

	// Test that Close doesn't panic
	err = db.Close()
	if err != nil {
		t.Errorf("Database close failed: %v", err)
	}

	// Test that calling Close again doesn't panic
	err = db.Close()
	if err != nil {
		t.Errorf("Second database close failed: %v", err)
	}
}