package models

import (
	"time"
)

type User struct {
	ID             string                 `json:"id" db:"id"`
	Email          string                 `json:"email" db:"email"`
	Name           string                 `json:"name" db:"name"`
	PasswordHash   string                 `json:"-" db:"password_hash"`
	Role           string                 `json:"role" db:"role"`
	OrganizationID *string                `json:"organizationId" db:"organization_id"`
	Preferences    map[string]interface{} `json:"preferences" db:"preferences"`
	AvatarURL      *string                `json:"avatarUrl" db:"avatar_url"`
	EmailVerified  bool                   `json:"emailVerified" db:"email_verified"`
	CreatedAt      time.Time              `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time              `json:"updatedAt" db:"updated_at"`
	LastLoginAt    *time.Time             `json:"lastLoginAt" db:"last_login_at"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type RegisterRequest struct {
	Email          string `json:"email" binding:"required,email"`
	Password       string `json:"password" binding:"required,min=8"`
	Name           string `json:"name" binding:"required,min=2"`
	OrganizationID string `json:"organizationId" binding:"required"`
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