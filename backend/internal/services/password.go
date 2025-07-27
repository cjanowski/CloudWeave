package services

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

const (
	// DefaultCost is the default bcrypt cost for password hashing
	DefaultCost = 12
)

type PasswordService struct {
	cost int
}

func NewPasswordService() *PasswordService {
	return &PasswordService{
		cost: DefaultCost,
	}
}

// HashPassword hashes a plain text password using bcrypt
func (p *PasswordService) HashPassword(password string) (string, error) {
	if len(password) == 0 {
		return "", fmt.Errorf("password cannot be empty")
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), p.cost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hashedBytes), nil
}

// VerifyPassword compares a plain text password with a hashed password
func (p *PasswordService) VerifyPassword(hashedPassword, password string) error {
	if len(password) == 0 {
		return fmt.Errorf("password cannot be empty")
	}

	if len(hashedPassword) == 0 {
		return fmt.Errorf("hashed password cannot be empty")
	}

	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if err != nil {
		if err == bcrypt.ErrMismatchedHashAndPassword {
			return fmt.Errorf("invalid password")
		}
		return fmt.Errorf("failed to verify password: %w", err)
	}

	return nil
}

// IsValidPassword checks if a password meets security requirements
func (p *PasswordService) IsValidPassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	if len(password) > 128 {
		return fmt.Errorf("password must be less than 128 characters long")
	}

	// Check for at least one uppercase letter
	hasUpper := false
	for _, char := range password {
		if char >= 'A' && char <= 'Z' {
			hasUpper = true
			break
		}
	}
	if !hasUpper {
		return fmt.Errorf("password must contain at least one uppercase letter")
	}

	// Check for at least one lowercase letter
	hasLower := false
	for _, char := range password {
		if char >= 'a' && char <= 'z' {
			hasLower = true
			break
		}
	}
	if !hasLower {
		return fmt.Errorf("password must contain at least one lowercase letter")
	}

	// Check for at least one digit
	hasDigit := false
	for _, char := range password {
		if char >= '0' && char <= '9' {
			hasDigit = true
			break
		}
	}
	if !hasDigit {
		return fmt.Errorf("password must contain at least one digit")
	}

	// Check for at least one special character
	hasSpecial := false
	specialChars := "!@#$%^&*()_+-=[]{}|;:,.<>?"
	for _, char := range password {
		for _, special := range specialChars {
			if char == special {
				hasSpecial = true
				break
			}
		}
		if hasSpecial {
			break
		}
	}
	if !hasSpecial {
		return fmt.Errorf("password must contain at least one special character (!@#$%%^&*()_+-=[]{}|;:,.<>?)")
	}

	return nil
}
