package services

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"cloudweave/internal/config"
	"cloudweave/internal/database"
	"cloudweave/internal/models"
	"cloudweave/internal/repositories"

	"github.com/google/uuid"
)

// Integration test for the complete authentication flow
func TestAuthService_Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Setup test database
	dbConfig := database.Config{
		Host:     "localhost",
		Port:     "5432",
		User:     "postgres",
		Password: "",
		DBName:   "postgres",
		SSLMode:  "disable",
	}

	db, err := database.NewDatabase(dbConfig)
	if err != nil {
		t.Skipf("Skipping integration test - PostgreSQL not available: %v", err)
		return
	}
	defer db.Close()

	// Create test tables (simplified schema for testing)
	setupTestTables(t, db.DB)
	defer cleanupTestTables(t, db.DB)

	// Setup services
	cfg := &config.Config{
		JWTSecret:         "test-secret-key-for-integration-testing",
		JWTExpirationTime: 15 * time.Minute,
		JWTRefreshTime:    7 * 24 * time.Hour,
	}

	blacklistService := NewTokenBlacklistService(db.DB)
	jwtService := NewJWTService(cfg, blacklistService)
	passwordService := NewPasswordService()
	userRepo := repositories.NewUserRepository(db.DB)
	orgRepo := repositories.NewOrganizationRepository(db.DB)

	authService := NewAuthService(userRepo, orgRepo, jwtService, passwordService, blacklistService)

	ctx := context.Background()

	// Create test organization
	orgID := uuid.New().String()
	_, err = db.DB.ExecContext(ctx, `
		INSERT INTO organizations (id, name, slug) 
		VALUES ($1, 'Test Org', 'test-org')
	`, orgID)
	if err != nil {
		t.Fatalf("Failed to create test organization: %v", err)
	}

	// Test user registration
	registerReq := models.RegisterRequest{
		Email:          "test@example.com",
		Password:       "TestPass123!",
		Name:           "Test User",
		OrganizationID: orgID,
	}

	registerResp, err := authService.Register(ctx, registerReq)
	if err != nil {
		t.Fatalf("Register failed: %v", err)
	}

	if !registerResp.Success {
		t.Error("Register response should be successful")
	}

	if registerResp.User.Email != registerReq.Email {
		t.Errorf("Expected email %s, got %s", registerReq.Email, registerResp.User.Email)
	}

	if registerResp.Token == "" {
		t.Error("Register should return access token")
	}

	if registerResp.RefreshToken == "" {
		t.Error("Register should return refresh token")
	}

	userID := registerResp.User.ID

	// Test login
	loginReq := models.LoginRequest{
		Email:    registerReq.Email,
		Password: registerReq.Password,
	}

	loginResp, err := authService.Login(ctx, loginReq)
	if err != nil {
		t.Fatalf("Login failed: %v", err)
	}

	if !loginResp.Success {
		t.Error("Login response should be successful")
	}

	if loginResp.User.ID != userID {
		t.Errorf("Expected user ID %s, got %s", userID, loginResp.User.ID)
	}

	// Test token validation
	claims, err := jwtService.ValidateToken(ctx, loginResp.Token)
	if err != nil {
		t.Fatalf("Token validation failed: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("Expected user ID %s in token, got %s", userID, claims.UserID)
	}

	// Test refresh token
	refreshReq := models.RefreshTokenRequest{
		RefreshToken: loginResp.RefreshToken,
	}

	refreshResp, err := authService.RefreshToken(ctx, refreshReq)
	if err != nil {
		t.Fatalf("Token refresh failed: %v", err)
	}

	if !refreshResp.Success {
		t.Error("Refresh response should be successful")
	}

	if refreshResp.Token == "" {
		t.Error("Refresh should return new access token")
	}

	if refreshResp.RefreshToken == "" {
		t.Error("Refresh should return new refresh token")
	}

	// Test that old refresh token is blacklisted
	_, err = authService.RefreshToken(ctx, refreshReq)
	if err == nil {
		t.Error("Old refresh token should be blacklisted and fail validation")
	}

	// Test password change
	err = authService.ChangePassword(ctx, userID, "TestPass123!", "NewTestPass456@")
	if err != nil {
		t.Fatalf("Password change failed: %v", err)
	}

	// Test login with old password should fail
	_, err = authService.Login(ctx, loginReq)
	if err == nil {
		t.Error("Login with old password should fail after password change")
	}

	// Test login with new password
	loginReq.Password = "NewTestPass456@"
	loginResp2, err := authService.Login(ctx, loginReq)
	if err != nil {
		t.Fatalf("Login with new password failed: %v", err)
	}

	// Test logout
	err = authService.Logout(ctx, loginResp2.Token, loginResp2.RefreshToken)
	if err != nil {
		t.Fatalf("Logout failed: %v", err)
	}

	// Test that tokens are blacklisted after logout
	_, err = jwtService.ValidateToken(ctx, loginResp2.Token)
	if err == nil {
		t.Error("Access token should be blacklisted after logout")
	}

	// Test logout all devices
	// First login again to get new tokens
	_, err = authService.Login(ctx, loginReq)
	if err != nil {
		t.Fatalf("Login for logout all test failed: %v", err)
	}

	err = authService.LogoutAllDevices(ctx, userID)
	if err != nil {
		t.Fatalf("Logout all devices failed: %v", err)
	}

	// Test duplicate registration should fail
	_, err = authService.Register(ctx, registerReq)
	if err == nil {
		t.Error("Duplicate registration should fail")
	}

	// Test invalid password validation
	invalidReq := registerReq
	invalidReq.Email = "test2@example.com"
	invalidReq.Password = "weak"
	_, err = authService.Register(ctx, invalidReq)
	if err == nil {
		t.Error("Registration with weak password should fail")
	}
}

func setupTestTables(t *testing.T, db *sql.DB) {
	// Create minimal test schema
	queries := []string{
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
		`CREATE TABLE IF NOT EXISTS organizations (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			name VARCHAR(255) NOT NULL,
			slug VARCHAR(100) UNIQUE NOT NULL,
			settings JSONB DEFAULT '{}',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			email VARCHAR(255) UNIQUE NOT NULL,
			name VARCHAR(255) NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			role VARCHAR(50) NOT NULL DEFAULT 'user',
			organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
			preferences JSONB DEFAULT '{}',
			avatar_url VARCHAR(500),
			email_verified BOOLEAN DEFAULT false,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			last_login_at TIMESTAMP WITH TIME ZONE
		)`,
		`CREATE TABLE IF NOT EXISTS token_blacklist (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			token_id VARCHAR(255) NOT NULL UNIQUE,
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('access', 'refresh')),
			expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
			blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			reason VARCHAR(100) DEFAULT 'logout'
		)`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			t.Fatalf("Failed to setup test table: %v", err)
		}
	}
}

func cleanupTestTables(t *testing.T, db *sql.DB) {
	queries := []string{
		`DROP TABLE IF EXISTS token_blacklist`,
		`DROP TABLE IF EXISTS users`,
		`DROP TABLE IF EXISTS organizations`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			t.Logf("Failed to cleanup test table: %v", err)
		}
	}
}