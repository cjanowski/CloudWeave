package services

import (
	"context"
	"testing"
	"time"

	"cloudweave/internal/config"
	"cloudweave/internal/models"
)

func TestJWTService_GenerateAccessToken(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:         "test-secret-key",
		JWTExpirationTime: 15 * time.Minute,
	}
	
	service := NewJWTService(cfg, nil)

	user := models.User{
		ID:             "test-user-id",
		Email:          "test@example.com",
		Name:           "Test User",
		Role:           "user",
		OrganizationID: stringPtr("org-id"),
	}

	token, err := service.GenerateAccessToken(user)
	if err != nil {
		t.Fatalf("GenerateAccessToken() failed: %v", err)
	}

	if token == "" {
		t.Error("GenerateAccessToken() returned empty token")
	}

	// Parse the token to verify its contents
	claims, err := service.ParseToken(token)
	if err != nil {
		t.Fatalf("ParseToken() failed: %v", err)
	}

	if claims.UserID != user.ID {
		t.Errorf("Expected UserID %s, got %s", user.ID, claims.UserID)
	}

	if claims.Email != user.Email {
		t.Errorf("Expected Email %s, got %s", user.Email, claims.Email)
	}

	if claims.Name != user.Name {
		t.Errorf("Expected Name %s, got %s", user.Name, claims.Name)
	}

	if claims.Role != user.Role {
		t.Errorf("Expected Role %s, got %s", user.Role, claims.Role)
	}
}

func TestJWTService_GenerateRefreshToken(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:      "test-secret-key",
		JWTRefreshTime: 7 * 24 * time.Hour,
	}
	
	service := NewJWTService(cfg, nil)
	userID := "test-user-id"

	token, err := service.GenerateRefreshToken(userID)
	if err != nil {
		t.Fatalf("GenerateRefreshToken() failed: %v", err)
	}

	if token == "" {
		t.Error("GenerateRefreshToken() returned empty token")
	}

	// Validate the refresh token
	claims, err := service.ValidateRefreshToken(context.Background(), token)
	if err != nil {
		t.Fatalf("ValidateRefreshToken() failed: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("Expected UserID %s, got %s", userID, claims.UserID)
	}
}

func TestJWTService_ValidateToken(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:         "test-secret-key",
		JWTExpirationTime: 15 * time.Minute,
	}
	
	service := NewJWTService(cfg, nil)

	user := models.User{
		ID:    "test-user-id",
		Email: "test@example.com",
		Name:  "Test User",
		Role:  "user",
	}

	// Generate a valid token
	token, err := service.GenerateAccessToken(user)
	if err != nil {
		t.Fatalf("GenerateAccessToken() failed: %v", err)
	}

	// Validate the token
	claims, err := service.ValidateToken(context.Background(), token)
	if err != nil {
		t.Fatalf("ValidateToken() failed: %v", err)
	}

	if claims.UserID != user.ID {
		t.Errorf("Expected UserID %s, got %s", user.ID, claims.UserID)
	}

	// Test invalid token
	_, err = service.ValidateToken(context.Background(), "invalid-token")
	if err == nil {
		t.Error("ValidateToken() should have failed for invalid token")
	}

	// Test token with wrong secret
	wrongSecretService := NewJWTService(&config.Config{
		JWTSecret:         "wrong-secret",
		JWTExpirationTime: 15 * time.Minute,
	}, nil)

	_, err = wrongSecretService.ValidateToken(context.Background(), token)
	if err == nil {
		t.Error("ValidateToken() should have failed for token with wrong secret")
	}
}

func TestJWTService_ExpiredToken(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:         "test-secret-key",
		JWTExpirationTime: -1 * time.Hour, // Expired token
	}
	
	service := NewJWTService(cfg, nil)

	user := models.User{
		ID:    "test-user-id",
		Email: "test@example.com",
		Name:  "Test User",
		Role:  "user",
	}

	// Generate an expired token
	token, err := service.GenerateAccessToken(user)
	if err != nil {
		t.Fatalf("GenerateAccessToken() failed: %v", err)
	}

	// Try to validate the expired token
	_, err = service.ValidateToken(context.Background(), token)
	if err != ErrExpiredToken {
		t.Errorf("Expected ErrExpiredToken, got %v", err)
	}

	// Check IsTokenExpired
	if !service.IsTokenExpired(token) {
		t.Error("IsTokenExpired() should return true for expired token")
	}
}

func TestJWTService_ParseToken(t *testing.T) {
	cfg := &config.Config{
		JWTSecret:         "test-secret-key",
		JWTExpirationTime: 15 * time.Minute,
	}
	
	service := NewJWTService(cfg, nil)

	user := models.User{
		ID:    "test-user-id",
		Email: "test@example.com",
		Name:  "Test User",
		Role:  "user",
	}

	token, err := service.GenerateAccessToken(user)
	if err != nil {
		t.Fatalf("GenerateAccessToken() failed: %v", err)
	}

	claims, err := service.ParseToken(token)
	if err != nil {
		t.Fatalf("ParseToken() failed: %v", err)
	}

	if claims.UserID != user.ID {
		t.Errorf("Expected UserID %s, got %s", user.ID, claims.UserID)
	}

	// Test invalid token
	_, err = service.ParseToken("invalid-token")
	if err == nil {
		t.Error("ParseToken() should have failed for invalid token")
	}
}

func TestGenerateRandomSecret(t *testing.T) {
	lengths := []int{16, 32, 64}

	for _, length := range lengths {
		t.Run(string(rune(length)), func(t *testing.T) {
			secret, err := GenerateRandomSecret(length)
			if err != nil {
				t.Fatalf("GenerateRandomSecret() failed: %v", err)
			}

			if len(secret) != length*2 { // Hex encoding doubles the length
				t.Errorf("Expected secret length %d, got %d", length*2, len(secret))
			}

			// Generate another secret and ensure they're different
			secret2, err := GenerateRandomSecret(length)
			if err != nil {
				t.Fatalf("GenerateRandomSecret() failed: %v", err)
			}

			if secret == secret2 {
				t.Error("GenerateRandomSecret() should generate different secrets")
			}
		})
	}
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}