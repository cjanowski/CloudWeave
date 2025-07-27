package repositories

import (
	"context"
	"database/sql"
	"fmt"
)

// TransactionManagerImpl provides transaction management capabilities
type TransactionManagerImpl struct {
	db *sql.DB
}

// NewTransactionManager creates a new transaction manager
func NewTransactionManager(db *sql.DB) *TransactionManagerImpl {
	return &TransactionManagerImpl{db: db}
}

// WithTransaction executes a function within a database transaction
// If the function returns an error, the transaction is rolled back
// Otherwise, the transaction is committed
func (tm *TransactionManagerImpl) WithTransaction(ctx context.Context, fn func(tx *sql.Tx) error) error {
	tx, err := tm.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	// Ensure transaction is always closed
	defer func() {
		if p := recover(); p != nil {
			// If there's a panic, rollback and re-panic
			tx.Rollback()
			panic(p)
		}
	}()

	// Execute the function
	if err := fn(tx); err != nil {
		// If function returns error, rollback
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("transaction failed: %v, rollback failed: %w", err, rbErr)
		}
		return err
	}

	// If function succeeds, commit
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// WithTransactionIsolation executes a function within a database transaction with specified isolation level
func (tm *TransactionManagerImpl) WithTransactionIsolation(ctx context.Context, isolation sql.IsolationLevel, fn func(tx *sql.Tx) error) error {
	tx, err := tm.db.BeginTx(ctx, &sql.TxOptions{
		Isolation: isolation,
	})
	if err != nil {
		return fmt.Errorf("failed to begin transaction with isolation %v: %w", isolation, err)
	}

	// Ensure transaction is always closed
	defer func() {
		if p := recover(); p != nil {
			// If there's a panic, rollback and re-panic
			tx.Rollback()
			panic(p)
		}
	}()

	// Execute the function
	if err := fn(tx); err != nil {
		// If function returns error, rollback
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("transaction failed: %v, rollback failed: %w", err, rbErr)
		}
		return err
	}

	// If function succeeds, commit
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// WithReadOnlyTransaction executes a function within a read-only transaction
func (tm *TransactionManagerImpl) WithReadOnlyTransaction(ctx context.Context, fn func(tx *sql.Tx) error) error {
	tx, err := tm.db.BeginTx(ctx, &sql.TxOptions{
		ReadOnly: true,
	})
	if err != nil {
		return fmt.Errorf("failed to begin read-only transaction: %w", err)
	}

	// Ensure transaction is always closed
	defer func() {
		if p := recover(); p != nil {
			// If there's a panic, rollback and re-panic
			tx.Rollback()
			panic(p)
		}
	}()

	// Execute the function
	if err := fn(tx); err != nil {
		// If function returns error, rollback
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("read-only transaction failed: %v, rollback failed: %w", err, rbErr)
		}
		return err
	}

	// If function succeeds, commit
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit read-only transaction: %w", err)
	}

	return nil
}
