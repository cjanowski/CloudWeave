package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"cloudweave/internal/config"
	"cloudweave/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTService struct {
	config *config.Config
}

type Claims struct {
	UserID         string `json:"sub"`
	Email          string `json:"email"`
	Name           string `json:"name"`
	Role           string `json:"role"`
	OrganizationID string `json:"organizationId"`
	TokenID        string `json:"jti"`
	jwt.RegisteredClaims
}

type RefreshClaims struct {
	UserID  string `json:"sub"`
	TokenID string `json:"jti"`
	jwt.RegisteredClaims
}

var (
	ErrInvalidToken     = errors.New("invalid token")
	ErrExpiredToken     = errors.New("token has expired")
	ErrInvalidSignature = errors.New("invalid token signature")
)

func NewJWTService(cfg *config.Config) *JWTService {
	return &JWTService{
		config: cfg,
	}
}

// GenerateAccessToken creates a new JWT access token for the user
func (j *JWTService) GenerateAccessToken(user models.User) (string, error) {
	tokenID := uuid.New().String()
	
	claims := Claims{
		UserID:         user.ID,
		Email:          user.Email,
		Name:           user.Name,
		Role:           user.Role,
		OrganizationID: user.OrganizationID,
		TokenID:        tokenID,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.config.JWTExpirationTime)),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "cloudweave",
			Subject:   user.ID,
			ID:        tokenID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.config.JWTSecret))
}

// GenerateRefreshToken creates a new JWT refresh token for the user
func (j *JWTService) GenerateRefreshToken(userID string) (string, error) {
	tokenID := uuid.New().String()
	
	claims := RefreshClaims{
		UserID:  userID,
		TokenID: tokenID,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.config.JWTRefreshTime)),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "cloudweave",
			Subject:   userID,
			ID:        tokenID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.config.JWTSecret))
}

// ValidateToken validates a JWT token and returns the claims
func (j *JWTService) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidSignature
		}
		return []byte(j.config.JWTSecret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, ErrInvalidToken
}

// ValidateRefreshToken validates a refresh token and returns the claims
func (j *JWTService) ValidateRefreshToken(tokenString string) (*RefreshClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &RefreshClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidSignature
		}
		return []byte(j.config.JWTSecret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	if claims, ok := token.Claims.(*RefreshClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, ErrInvalidToken
}

// ParseToken extracts claims from a token without validation (for debugging)
func (j *JWTService) ParseToken(tokenString string) (*Claims, error) {
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, &Claims{})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok {
		return claims, nil
	}

	return nil, ErrInvalidToken
}

// GenerateRandomSecret generates a cryptographically secure random string for JWT secret
func GenerateRandomSecret(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// IsTokenExpired checks if a token is expired without full validation
func (j *JWTService) IsTokenExpired(tokenString string) bool {
	claims, err := j.ParseToken(tokenString)
	if err != nil {
		return true
	}
	
	return claims.ExpiresAt.Before(time.Now())
}