package models

import (
	"time"
)

type User struct {
	ID             string     `json:"id" db:"id"`
	Email          string     `json:"email" db:"email"`
	Name           string     `json:"name" db:"name"`
	PasswordHash   string     `json:"-" db:"password_hash"`
	OrganizationID string     `json:"organizationId" db:"organization_id"`
	IsActive       bool       `json:"isActive" db:"is_active"`
	CreatedAt      time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time  `json:"updatedAt" db:"updated_at"`
	LastLoginAt    *time.Time `json:"lastLoginAt" db:"last_login_at"`

	// SSO fields
	SSOProvider *string `json:"ssoProvider" db:"sso_provider"`
	SSOSubject  *string `json:"ssoSubject" db:"sso_subject"`

	// Virtual fields for compatibility
	Role          string                 `json:"role" db:"-"`
	Preferences   map[string]interface{} `json:"preferences" db:"-"`
	AvatarURL     *string                `json:"avatarUrl" db:"-"`
	EmailVerified bool                   `json:"emailVerified" db:"-"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type RegisterRequest struct {
	Email           string `json:"email" binding:"required,email"`
	Password        string `json:"password" binding:"required,min=8"`
	ConfirmPassword string `json:"confirmPassword" binding:"required,min=8"`
	Name            string `json:"name" binding:"required,min=2"`
	OrganizationID  string `json:"organizationId,omitempty"` // Optional - will create if not provided
	CompanyName     string `json:"companyName,omitempty"`    // Used to create organization if not provided
}

type LoginResponse struct {
	Success      bool   `json:"success"`
	User         User   `json:"user"`
	Token        string `json:"token"`
	RefreshToken string `json:"refreshToken"`
}

type RegisterResponse struct {
	Success      bool   `json:"success"`
	User         User   `json:"user"`
	Token        string `json:"token"`
	RefreshToken string `json:"refreshToken"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

type RefreshTokenResponse struct {
	Success      bool   `json:"success"`
	Token        string `json:"token"`
	RefreshToken string `json:"refreshToken"`
}

// SSO Models
type SSOLoginRequest struct {
	Provider string `json:"provider" binding:"required"`
	State    string `json:"state,omitempty"`
}

type SSOCallbackRequest struct {
	Provider string `json:"provider" binding:"required"`
	Code     string `json:"code" binding:"required"`
	State    string `json:"state,omitempty"`
}

type SSOUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	FirstName     string `json:"firstName,omitempty"`
	LastName      string `json:"lastName,omitempty"`
	AvatarURL     string `json:"avatarUrl,omitempty"`
	EmailVerified bool   `json:"emailVerified"`
}

type SAMLRequest struct {
	SAMLResponse string `form:"SAMLResponse" binding:"required"`
	RelayState   string `form:"RelayState,omitempty"`
}

type SSOConfigResponse struct {
	OAuth OAuthConfigResponse `json:"oauth"`
	SAML  SAMLConfigResponse  `json:"saml"`
}

type OAuthConfigResponse struct {
	Enabled   bool                           `json:"enabled"`
	Providers map[string]OAuthProviderConfig `json:"providers"`
}

type OAuthProviderConfig struct {
	Enabled     bool   `json:"enabled"`
	AuthURL     string `json:"authUrl,omitempty"`
	RedirectURL string `json:"redirectUrl,omitempty"`
}

type SAMLConfigResponse struct {
	Enabled     bool   `json:"enabled"`
	EntityID    string `json:"entityId,omitempty"`
	SSOURL      string `json:"ssoUrl,omitempty"`
	MetadataURL string `json:"metadataUrl,omitempty"`
}

type ApiResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Error     *ApiError   `json:"error,omitempty"`
	RequestID string      `json:"requestId,omitempty"`
}

type ApiError struct {
	Code      string      `json:"code"`
	Message   string      `json:"message"`
	Details   interface{} `json:"details,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}
