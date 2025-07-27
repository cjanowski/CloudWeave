package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

type TokenBlacklistService struct {
	db *sql.DB
}

type BlacklistedToken struct {
	ID            string    `json:"id" db:"id"`
	TokenID       string    `json:"tokenId" db:"token_id"`
	UserID        string    `json:"userId" db:"user_id"`
	TokenType     string    `json:"tokenType" db:"token_type"`
	ExpiresAt     time.Time `json:"expiresAt" db:"expires_at"`
	BlacklistedAt time.Time `json:"blacklistedAt" db:"blacklisted_at"`
	Reason        string    `json:"reason" db:"reason"`
}

func NewTokenBlacklistService(db *sql.DB) *TokenBlacklistService {
	return &TokenBlacklistService{db: db}
}

// BlacklistToken adds a token to the blacklist
func (s *TokenBlacklistService) BlacklistToken(ctx context.Context, tokenID, userID, tokenType string, expiresAt time.Time, reason string) error {
	query := `
		INSERT INTO token_blacklist (token_id, user_id, token_type, expires_at, reason)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (token_id) DO NOTHING`

	_, err := s.db.ExecContext(ctx, query, tokenID, userID, tokenType, expiresAt, reason)
	if err != nil {
		return fmt.Errorf("failed to blacklist token: %w", err)
	}

	return nil
}

// IsTokenBlacklisted checks if a token is blacklisted
func (s *TokenBlacklistService) IsTokenBlacklisted(ctx context.Context, tokenID string) (bool, error) {
	var exists bool
	query := `
		SELECT EXISTS(
			SELECT 1 FROM token_blacklist 
			WHERE token_id = $1 AND expires_at > NOW()
		)`

	err := s.db.QueryRowContext(ctx, query, tokenID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check token blacklist status: %w", err)
	}

	return exists, nil
}

// BlacklistAllUserTokens blacklists all tokens for a specific user
func (s *TokenBlacklistService) BlacklistAllUserTokens(ctx context.Context, userID string, reason string) error {
	// This is a placeholder - in a real implementation, you'd need to track active tokens
	// For now, we'll just add a record that can be used to invalidate future token validations
	query := `
		INSERT INTO token_blacklist (token_id, user_id, token_type, expires_at, reason)
		VALUES ($1, $2, 'all', $3, $4)
		ON CONFLICT (token_id) DO NOTHING`

	tokenID := fmt.Sprintf("user_%s_all_tokens_%d", userID, time.Now().Unix())
	expiresAt := time.Now().Add(24 * time.Hour) // Expire after 24 hours

	_, err := s.db.ExecContext(ctx, query, tokenID, userID, expiresAt, reason)
	if err != nil {
		return fmt.Errorf("failed to blacklist all user tokens: %w", err)
	}

	return nil
}

// CleanupExpiredTokens removes expired tokens from the blacklist
func (s *TokenBlacklistService) CleanupExpiredTokens(ctx context.Context) error {
	query := `DELETE FROM token_blacklist WHERE expires_at < NOW()`

	result, err := s.db.ExecContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to cleanup expired tokens: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	fmt.Printf("Cleaned up %d expired blacklisted tokens\n", rowsAffected)
	return nil
}

// GetBlacklistedTokensByUser retrieves all blacklisted tokens for a user
func (s *TokenBlacklistService) GetBlacklistedTokensByUser(ctx context.Context, userID string) ([]*BlacklistedToken, error) {
	query := `
		SELECT id, token_id, user_id, token_type, expires_at, blacklisted_at, reason
		FROM token_blacklist
		WHERE user_id = $1 AND expires_at > NOW()
		ORDER BY blacklisted_at DESC`

	rows, err := s.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get blacklisted tokens: %w", err)
	}
	defer rows.Close()

	var tokens []*BlacklistedToken
	for rows.Next() {
		token := &BlacklistedToken{}
		err := rows.Scan(
			&token.ID,
			&token.TokenID,
			&token.UserID,
			&token.TokenType,
			&token.ExpiresAt,
			&token.BlacklistedAt,
			&token.Reason,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan blacklisted token: %w", err)
		}
		tokens = append(tokens, token)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating blacklisted tokens: %w", err)
	}

	return tokens, nil
}
