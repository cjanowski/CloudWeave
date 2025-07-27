package services

import (
	"context"
	"fmt"
	"regexp"
	"strings"

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
	fmt.Printf("DEBUG: Login attempt for email: %s\n", req.Email)

	// Get user by email
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		fmt.Printf("DEBUG: User not found for email %s: %v\n", req.Email, err)
		return nil, fmt.Errorf("invalid email or password")
	}

	fmt.Printf("DEBUG: Found user %s with hash: %s\n", user.Email, user.PasswordHash)
	fmt.Printf("DEBUG: Attempting to verify password: %s\n", req.Password)

	// Verify password
	if err := s.passwordService.VerifyPassword(user.PasswordHash, req.Password); err != nil {
		fmt.Printf("DEBUG: Password verification failed: %v\n", err)
		return nil, fmt.Errorf("invalid email or password")
	}

	fmt.Printf("DEBUG: Password verification successful for user %s\n", user.Email)

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
	// Validate that passwords match
	if req.Password != req.ConfirmPassword {
		return nil, fmt.Errorf("passwords do not match")
	}

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

	var org *models.Organization

	// If organization ID is provided, verify it exists
	if req.OrganizationID != "" {
		org, err = s.orgRepo.GetByID(ctx, req.OrganizationID)
		if err != nil {
			return nil, fmt.Errorf("invalid organization ID: %w", err)
		}
	} else {
		// Create a new organization for the user
		companyName := req.CompanyName
		if companyName == "" {
			companyName = fmt.Sprintf("%s's Organization", req.Name)
		}

		// Generate a slug from the company name
		slug := generateSlugFromName(companyName)

		// Ensure slug is unique
		slug, err = s.ensureUniqueSlug(ctx, slug)
		if err != nil {
			return nil, fmt.Errorf("failed to generate unique organization slug: %w", err)
		}

		org = &models.Organization{
			ID:       uuid.New().String(),
			Name:     companyName,
			Slug:     slug,
			Settings: map[string]interface{}{},
		}

		if err := s.orgRepo.Create(ctx, org); err != nil {
			return nil, fmt.Errorf("failed to create organization: %w", err)
		}
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
		OrganizationID: org.ID,
		IsActive:       true,
		Role:           "user", // Default role
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

// Helper function to generate slug from name
func generateSlugFromName(name string) string {
	// Convert to lowercase
	slug := strings.ToLower(name)

	// Replace spaces and special characters with hyphens
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	slug = reg.ReplaceAllString(slug, "-")

	// Remove leading/trailing hyphens
	slug = strings.Trim(slug, "-")

	// Limit length
	if len(slug) > 50 {
		slug = slug[:50]
	}

	return slug
}

// Helper function to ensure slug uniqueness
func (s *AuthService) ensureUniqueSlug(ctx context.Context, baseSlug string) (string, error) {
	slug := baseSlug
	counter := 1

	for {
		// Check if slug exists
		exists, err := s.orgRepo.SlugExists(ctx, slug)
		if err != nil {
			return "", err
		}

		if !exists {
			return slug, nil
		}

		// Try with counter
		slug = fmt.Sprintf("%s-%d", baseSlug, counter)
		counter++

		// Prevent infinite loop
		if counter > 1000 {
			return "", fmt.Errorf("unable to generate unique slug")
		}
	}
}
