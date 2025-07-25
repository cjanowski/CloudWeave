package services

import (
	"context"
	"fmt"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"

	"github.com/google/uuid"
)

type AuthService struct {
	userRepo         *repositories.UserRepository
	orgRepo          *repositories.OrganizationRepository
	jwtService       *JWTService
	passwordService  *PasswordService
	blacklistService *TokenBlacklistService
}

func NewAuthService(
	userRepo *repositories.UserRepository,
	orgRepo *repositories.OrganizationRepository,
	jwtService *JWTService,
	passwordService *PasswordService,
	blacklistService *TokenBlacklistService,
) *AuthService {
	return &AuthService{
		userRepo:         userRepo,
		orgRepo:          orgRepo,
		jwtService:       jwtService,
		passwordService:  passwordService,
		blacklistService: blacklistService,
	}
}

// Login authenticates a user with email and password
func (s *AuthService) Login(ctx context.Context, req models.LoginRequest) (*models.LoginResponse, error) {
	// Get user by email
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Verify password
	if err := s.passwordService.VerifyPassword(user.PasswordHash, req.Password); err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Update last login timestamp
	if err := s.userRepo.UpdateLastLogin(ctx, user.ID); err != nil {
		// Log error but don't fail the login
		fmt.Printf("Failed to update last login for user %s: %v\n", user.ID, err)
	}

	// Generate JWT tokens
	accessToken, err := s.jwtService.GenerateAccessToken(*user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.jwtService.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Clear password hash from response
	user.PasswordHash = ""

	return &models.LoginResponse{
		Success:      true,
		User:         *user,
		Token:        accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// Register creates a new user account
func (s *AuthService) Register(ctx context.Context, req models.RegisterRequest) (*models.RegisterResponse, error) {
	// Validate password strength
	if err := s.passwordService.IsValidPassword(req.Password); err != nil {
		return nil, fmt.Errorf("password validation failed: %w", err)
	}

	// Check if email already exists
	exists, err := s.userRepo.EmailExists(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check email existence: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("user with email %s already exists", req.Email)
	}

	// Verify organization exists
	org, err := s.orgRepo.GetByID(ctx, req.OrganizationID)
	if err != nil {
		return nil, fmt.Errorf("invalid organization ID: %w", err)
	}

	// Hash password
	hashedPassword, err := s.passwordService.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &models.User{
		ID:             uuid.New().String(),
		Email:          req.Email,
		Name:           req.Name,
		PasswordHash:   hashedPassword,
		Role:           "user", // Default role
		OrganizationID: &org.ID,
		Preferences:    make(map[string]interface{}),
		EmailVerified:  false,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate JWT tokens
	accessToken, err := s.jwtService.GenerateAccessToken(*user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.jwtService.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Clear password hash from response
	user.PasswordHash = ""

	return &models.RegisterResponse{
		Success:      true,
		User:         *user,
		Token:        accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// RefreshToken generates new access and refresh tokens
func (s *AuthService) RefreshToken(ctx context.Context, req models.RefreshTokenRequest) (*models.RefreshTokenResponse, error) {
	// Validate refresh token
	claims, err := s.jwtService.ValidateRefreshToken(ctx, req.RefreshToken)
	if err != nil {
		return nil, fmt.Errorf("invalid or expired refresh token: %w", err)
	}

	// Get user from database to ensure they still exist and get latest data
	user, err := s.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Blacklist the old refresh token
	if err := s.jwtService.BlacklistRefreshToken(ctx, req.RefreshToken, "token_refresh"); err != nil {
		// Log error but don't fail the refresh
		fmt.Printf("Failed to blacklist old refresh token: %v\n", err)
	}

	// Generate new tokens
	newAccessToken, err := s.jwtService.GenerateAccessToken(*user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate new access token: %w", err)
	}

	newRefreshToken, err := s.jwtService.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate new refresh token: %w", err)
	}

	return &models.RefreshTokenResponse{
		Success:      true,
		Token:        newAccessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

// GetUserByID retrieves a user by their ID
func (s *AuthService) GetUserByID(ctx context.Context, userID string) (*models.User, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Clear password hash from response
	user.PasswordHash = ""

	return user, nil
}

// ChangePassword changes a user's password
func (s *AuthService) ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) error {
	// Get user
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Verify current password
	if err := s.passwordService.VerifyPassword(user.PasswordHash, currentPassword); err != nil {
		return fmt.Errorf("current password is incorrect")
	}

	// Validate new password
	if err := s.passwordService.IsValidPassword(newPassword); err != nil {
		return fmt.Errorf("new password validation failed: %w", err)
	}

	// Hash new password
	hashedPassword, err := s.passwordService.HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	// Update password in database
	if err := s.userRepo.UpdatePassword(ctx, userID, hashedPassword); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

// Logout invalidates the user's tokens
func (s *AuthService) Logout(ctx context.Context, accessToken, refreshToken string) error {
	// Blacklist access token
	if accessToken != "" {
		if err := s.jwtService.BlacklistToken(ctx, accessToken, "logout"); err != nil {
			fmt.Printf("Failed to blacklist access token: %v\n", err)
		}
	}

	// Blacklist refresh token
	if refreshToken != "" {
		if err := s.jwtService.BlacklistRefreshToken(ctx, refreshToken, "logout"); err != nil {
			fmt.Printf("Failed to blacklist refresh token: %v\n", err)
		}
	}

	return nil
}

// LogoutAllDevices invalidates all tokens for a user
func (s *AuthService) LogoutAllDevices(ctx context.Context, userID string) error {
	if s.blacklistService == nil {
		return fmt.Errorf("blacklist service not available")
	}

	return s.blacklistService.BlacklistAllUserTokens(ctx, userID, "logout_all_devices")
}