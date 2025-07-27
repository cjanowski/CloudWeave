package services

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"cloudweave/internal/config"
	"cloudweave/internal/models"
	"cloudweave/internal/repositories"

	"github.com/google/uuid"
	"golang.org/x/oauth2"
)

type SSOService struct {
	config      *config.Config
	userRepo    *repositories.UserRepository
	orgRepo     *repositories.OrganizationRepository
	authService *AuthService
	jwtService  *JWTService
}

func NewSSOService(
	cfg *config.Config,
	userRepo *repositories.UserRepository,
	orgRepo *repositories.OrganizationRepository,
	authService *AuthService,
	jwtService *JWTService,
) *SSOService {
	return &SSOService{
		config:      cfg,
		userRepo:    userRepo,
		orgRepo:     orgRepo,
		authService: authService,
		jwtService:  jwtService,
	}
}

// GetSSOConfig returns the public SSO configuration
func (s *SSOService) GetSSOConfig() *models.SSOConfigResponse {
	providers := make(map[string]models.OAuthProviderConfig)

	if s.config.SSO.OAuth.Google.Enabled {
		providers["google"] = models.OAuthProviderConfig{
			Enabled:     true,
			AuthURL:     s.config.SSO.OAuth.Google.AuthURL,
			RedirectURL: s.config.SSO.OAuth.Google.RedirectURL,
		}
	}

	if s.config.SSO.OAuth.Microsoft.Enabled {
		providers["microsoft"] = models.OAuthProviderConfig{
			Enabled:     true,
			AuthURL:     s.config.SSO.OAuth.Microsoft.AuthURL,
			RedirectURL: s.config.SSO.OAuth.Microsoft.RedirectURL,
		}
	}

	if s.config.SSO.OAuth.GitHub.Enabled {
		providers["github"] = models.OAuthProviderConfig{
			Enabled:     true,
			AuthURL:     s.config.SSO.OAuth.GitHub.AuthURL,
			RedirectURL: s.config.SSO.OAuth.GitHub.RedirectURL,
		}
	}

	if s.config.SSO.OAuth.Generic.Enabled {
		providers["generic"] = models.OAuthProviderConfig{
			Enabled:     true,
			AuthURL:     s.config.SSO.OAuth.Generic.AuthURL,
			RedirectURL: s.config.SSO.OAuth.Generic.RedirectURL,
		}
	}

	return &models.SSOConfigResponse{
		OAuth: models.OAuthConfigResponse{
			Enabled:   s.config.SSO.OAuth.Enabled,
			Providers: providers,
		},
		SAML: models.SAMLConfigResponse{
			Enabled:     s.config.SSO.SAML.Enabled,
			EntityID:    s.config.SSO.SAML.EntityID,
			SSOURL:      s.config.SSO.SAML.SSOURL,
			MetadataURL: s.config.SSO.SAML.MetadataURL,
		},
	}
}

// GetOAuthAuthURL generates an OAuth authorization URL
func (s *SSOService) GetOAuthAuthURL(provider string, state string) (string, error) {
	oauthConfig, err := s.getOAuthConfig(provider)
	if err != nil {
		return "", err
	}

	if state == "" {
		state = s.generateState()
	}

	authURL := oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	return authURL, nil
}

// HandleOAuthCallback processes OAuth callback and creates/logs in user
func (s *SSOService) HandleOAuthCallback(ctx context.Context, provider, code, state string, organizationID string) (*models.LoginResponse, error) {
	oauthConfig, err := s.getOAuthConfig(provider)
	if err != nil {
		return nil, err
	}

	// Exchange code for token
	token, err := oauthConfig.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code for token: %w", err)
	}

	// Get user info from provider
	userInfo, err := s.getUserInfoFromProvider(ctx, provider, token.AccessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}

	// Find or create user
	user, err := s.findOrCreateSSOUser(ctx, provider, userInfo, organizationID)
	if err != nil {
		return nil, fmt.Errorf("failed to find or create user: %w", err)
	}

	// Update last login
	if err := s.userRepo.UpdateLastLogin(ctx, user.ID); err != nil {
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

	// Clear sensitive data
	user.PasswordHash = ""

	return &models.LoginResponse{
		Success:      true,
		User:         *user,
		Token:        accessToken,
		RefreshToken: refreshToken,
	}, nil
}

// getOAuthConfig returns OAuth2 config for the specified provider
func (s *SSOService) getOAuthConfig(provider string) (*oauth2.Config, error) {
	var providerConfig config.OAuthProvider

	switch strings.ToLower(provider) {
	case "google":
		if !s.config.SSO.OAuth.Google.Enabled {
			return nil, fmt.Errorf("Google OAuth is not enabled")
		}
		providerConfig = s.config.SSO.OAuth.Google
	case "microsoft":
		if !s.config.SSO.OAuth.Microsoft.Enabled {
			return nil, fmt.Errorf("Microsoft OAuth is not enabled")
		}
		providerConfig = s.config.SSO.OAuth.Microsoft
	case "github":
		if !s.config.SSO.OAuth.GitHub.Enabled {
			return nil, fmt.Errorf("GitHub OAuth is not enabled")
		}
		providerConfig = s.config.SSO.OAuth.GitHub
	case "generic":
		if !s.config.SSO.OAuth.Generic.Enabled {
			return nil, fmt.Errorf("Generic OAuth is not enabled")
		}
		providerConfig = s.config.SSO.OAuth.Generic
	default:
		return nil, fmt.Errorf("unsupported OAuth provider: %s", provider)
	}

	return &oauth2.Config{
		ClientID:     providerConfig.ClientID,
		ClientSecret: providerConfig.ClientSecret,
		RedirectURL:  providerConfig.RedirectURL,
		Scopes:       providerConfig.Scopes,
		Endpoint: oauth2.Endpoint{
			AuthURL:  providerConfig.AuthURL,
			TokenURL: providerConfig.TokenURL,
		},
	}, nil
}

// getUserInfoFromProvider fetches user information from the OAuth provider
func (s *SSOService) getUserInfoFromProvider(ctx context.Context, provider, accessToken string) (*models.SSOUserInfo, error) {
	var userInfoURL string

	switch strings.ToLower(provider) {
	case "google":
		userInfoURL = s.config.SSO.OAuth.Google.UserInfoURL
	case "microsoft":
		userInfoURL = s.config.SSO.OAuth.Microsoft.UserInfoURL
	case "github":
		userInfoURL = s.config.SSO.OAuth.GitHub.UserInfoURL
	case "generic":
		userInfoURL = s.config.SSO.OAuth.Generic.UserInfoURL
	default:
		return nil, fmt.Errorf("unsupported provider: %s", provider)
	}

	req, err := http.NewRequestWithContext(ctx, "GET", userInfoURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get user info, status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return s.parseUserInfo(provider, body)
}

// parseUserInfo parses user information based on provider format
func (s *SSOService) parseUserInfo(provider string, data []byte) (*models.SSOUserInfo, error) {
	var userInfo models.SSOUserInfo

	switch strings.ToLower(provider) {
	case "google":
		var googleUser struct {
			ID            string `json:"id"`
			Email         string `json:"email"`
			Name          string `json:"name"`
			GivenName     string `json:"given_name"`
			FamilyName    string `json:"family_name"`
			Picture       string `json:"picture"`
			VerifiedEmail bool   `json:"verified_email"`
		}

		if err := json.Unmarshal(data, &googleUser); err != nil {
			return nil, err
		}

		userInfo = models.SSOUserInfo{
			ID:            googleUser.ID,
			Email:         googleUser.Email,
			Name:          googleUser.Name,
			FirstName:     googleUser.GivenName,
			LastName:      googleUser.FamilyName,
			AvatarURL:     googleUser.Picture,
			EmailVerified: googleUser.VerifiedEmail,
		}

	case "microsoft":
		var msUser struct {
			ID                string `json:"id"`
			Mail              string `json:"mail"`
			UserPrincipalName string `json:"userPrincipalName"`
			DisplayName       string `json:"displayName"`
			GivenName         string `json:"givenName"`
			Surname           string `json:"surname"`
		}

		if err := json.Unmarshal(data, &msUser); err != nil {
			return nil, err
		}

		email := msUser.Mail
		if email == "" {
			email = msUser.UserPrincipalName
		}

		userInfo = models.SSOUserInfo{
			ID:            msUser.ID,
			Email:         email,
			Name:          msUser.DisplayName,
			FirstName:     msUser.GivenName,
			LastName:      msUser.Surname,
			EmailVerified: true, // Microsoft emails are typically verified
		}

	case "github":
		var githubUser struct {
			ID        int    `json:"id"`
			Login     string `json:"login"`
			Email     string `json:"email"`
			Name      string `json:"name"`
			AvatarURL string `json:"avatar_url"`
		}

		if err := json.Unmarshal(data, &githubUser); err != nil {
			return nil, err
		}

		// GitHub might not return email in the user endpoint, need to fetch separately
		if githubUser.Email == "" {
			// For now, we'll use login@github.local as a fallback
			githubUser.Email = fmt.Sprintf("%s@github.local", githubUser.Login)
		}

		userInfo = models.SSOUserInfo{
			ID:            fmt.Sprintf("%d", githubUser.ID),
			Email:         githubUser.Email,
			Name:          githubUser.Name,
			AvatarURL:     githubUser.AvatarURL,
			EmailVerified: false, // GitHub emails might not be verified
		}

	default:
		// Generic OAuth provider - assume standard OpenID Connect format
		var genericUser struct {
			Sub           string `json:"sub"`
			Email         string `json:"email"`
			Name          string `json:"name"`
			GivenName     string `json:"given_name"`
			FamilyName    string `json:"family_name"`
			Picture       string `json:"picture"`
			EmailVerified bool   `json:"email_verified"`
		}

		if err := json.Unmarshal(data, &genericUser); err != nil {
			return nil, err
		}

		userInfo = models.SSOUserInfo{
			ID:            genericUser.Sub,
			Email:         genericUser.Email,
			Name:          genericUser.Name,
			FirstName:     genericUser.GivenName,
			LastName:      genericUser.FamilyName,
			AvatarURL:     genericUser.Picture,
			EmailVerified: genericUser.EmailVerified,
		}
	}

	return &userInfo, nil
}

// findOrCreateSSOUser finds existing user or creates new one for SSO login
func (s *SSOService) findOrCreateSSOUser(ctx context.Context, provider string, userInfo *models.SSOUserInfo, organizationID string) (*models.User, error) {
	// First try to find user by SSO provider and subject
	user, err := s.getUserBySSOProvider(ctx, provider, userInfo.ID)
	if err == nil {
		return user, nil
	}

	// If not found by SSO, try to find by email
	user, err = s.userRepo.GetByEmail(ctx, userInfo.Email)
	if err == nil {
		// User exists with this email, link SSO account
		ssoProvider := provider
		ssoSubject := userInfo.ID
		user.SSOProvider = &ssoProvider
		user.SSOSubject = &ssoSubject

		if err := s.updateUserSSOInfo(ctx, user.ID, provider, userInfo.ID); err != nil {
			return nil, fmt.Errorf("failed to link SSO account: %w", err)
		}

		return user, nil
	}

	// User doesn't exist, create new one
	if organizationID == "" {
		// Try to get default organization or create one
		params := repositories.ListParams{
			Limit:  1,
			Offset: 0,
		}
		orgs, err := s.orgRepo.List(ctx, params)
		if err != nil || len(orgs) == 0 {
			return nil, fmt.Errorf("no organization specified and no default organization found")
		}
		organizationID = orgs[0].ID
	}

	// Verify organization exists
	org, err := s.orgRepo.GetByID(ctx, organizationID)
	if err != nil {
		return nil, fmt.Errorf("invalid organization ID: %w", err)
	}

	ssoProvider := provider
	ssoSubject := userInfo.ID

	user = &models.User{
		ID:             uuid.New().String(),
		Email:          userInfo.Email,
		Name:           userInfo.Name,
		PasswordHash:   "", // No password for SSO users
		OrganizationID: org.ID,
		IsActive:       true,
		SSOProvider:    &ssoProvider,
		SSOSubject:     &ssoSubject,
		Role:           "user",
		Preferences:    make(map[string]interface{}),
		EmailVerified:  userInfo.EmailVerified,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create SSO user: %w", err)
	}

	return user, nil
}

// getUserBySSOProvider finds a user by SSO provider and subject
func (s *SSOService) getUserBySSOProvider(ctx context.Context, provider, subject string) (*models.User, error) {
	// Since the user repository doesn't have this method, we'll implement it here
	// by querying users and checking SSO fields
	params := repositories.ListParams{
		Limit:  100, // Should be enough for most cases
		Offset: 0,
	}
	
	users, err := s.userRepo.List(ctx, params)
	if err != nil {
		return nil, err
	}
	
	for _, user := range users {
		if user.SSOProvider != nil && user.SSOSubject != nil &&
			*user.SSOProvider == provider && *user.SSOSubject == subject {
			return user, nil
		}
	}
	
	return nil, fmt.Errorf("user not found with SSO provider %s and subject %s", provider, subject)
}

// updateUserSSOInfo updates the SSO information for a user
func (s *SSOService) updateUserSSOInfo(ctx context.Context, userID, provider, subject string) error {
	// Since the user repository doesn't have this method, we'll need to add it
	// For now, we'll implement a basic version using the existing Update method
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	
	ssoProvider := provider
	ssoSubject := subject
	user.SSOProvider = &ssoProvider
	user.SSOSubject = &ssoSubject
	
	return s.userRepo.Update(ctx, user)
}

// generateState generates a random state parameter for OAuth
func (s *SSOService) generateState() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
