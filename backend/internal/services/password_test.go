package services

import (
	"testing"
)

func TestPasswordService_HashPassword(t *testing.T) {
	service := NewPasswordService()

	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{
			name:     "valid password",
			password: "ValidPass123!",
			wantErr:  false,
		},
		{
			name:     "empty password",
			password: "",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := service.HashPassword(tt.password)
			
			if tt.wantErr {
				if err == nil {
					t.Errorf("HashPassword() expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Errorf("HashPassword() unexpected error: %v", err)
				return
			}

			if hash == "" {
				t.Errorf("HashPassword() returned empty hash")
			}

			if hash == tt.password {
				t.Errorf("HashPassword() returned unhashed password")
			}
		})
	}
}

func TestPasswordService_VerifyPassword(t *testing.T) {
	service := NewPasswordService()
	password := "ValidPass123!"
	
	hash, err := service.HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password for test: %v", err)
	}

	tests := []struct {
		name           string
		hashedPassword string
		password       string
		wantErr        bool
	}{
		{
			name:           "correct password",
			hashedPassword: hash,
			password:       password,
			wantErr:        false,
		},
		{
			name:           "incorrect password",
			hashedPassword: hash,
			password:       "WrongPassword123!",
			wantErr:        true,
		},
		{
			name:           "empty password",
			hashedPassword: hash,
			password:       "",
			wantErr:        true,
		},
		{
			name:           "empty hash",
			hashedPassword: "",
			password:       password,
			wantErr:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := service.VerifyPassword(tt.hashedPassword, tt.password)
			
			if tt.wantErr {
				if err == nil {
					t.Errorf("VerifyPassword() expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Errorf("VerifyPassword() unexpected error: %v", err)
			}
		})
	}
}

func TestPasswordService_IsValidPassword(t *testing.T) {
	service := NewPasswordService()

	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{
			name:     "valid password",
			password: "ValidPass123!",
			wantErr:  false,
		},
		{
			name:     "too short",
			password: "Short1!",
			wantErr:  true,
		},
		{
			name:     "too long",
			password: "ThisPasswordIsWayTooLongAndExceedsTheMaximumLengthLimitOfOneHundredTwentyEightCharactersWhichShouldCauseValidationToFailBecauseItIsReallyReallyLong123!",
			wantErr:  true,
		},
		{
			name:     "no uppercase",
			password: "validpass123!",
			wantErr:  true,
		},
		{
			name:     "no lowercase",
			password: "VALIDPASS123!",
			wantErr:  true,
		},
		{
			name:     "no digit",
			password: "ValidPass!",
			wantErr:  true,
		},
		{
			name:     "no special character",
			password: "ValidPass123",
			wantErr:  true,
		},
		{
			name:     "minimum valid password",
			password: "Valid1!a",
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := service.IsValidPassword(tt.password)
			
			if tt.wantErr {
				if err == nil {
					t.Errorf("IsValidPassword() expected error for password '%s', got nil", tt.password)
				}
				return
			}

			if err != nil {
				t.Errorf("IsValidPassword() unexpected error for password '%s': %v", tt.password, err)
			}
		})
	}
}

func TestPasswordService_HashAndVerifyRoundTrip(t *testing.T) {
	service := NewPasswordService()
	passwords := []string{
		"ValidPass123!",
		"AnotherValid456@",
		"Complex#Password789$",
	}

	for _, password := range passwords {
		t.Run(password, func(t *testing.T) {
			// Hash the password
			hash, err := service.HashPassword(password)
			if err != nil {
				t.Fatalf("HashPassword() failed: %v", err)
			}

			// Verify the password
			err = service.VerifyPassword(hash, password)
			if err != nil {
				t.Errorf("VerifyPassword() failed for correct password: %v", err)
			}

			// Verify wrong password fails
			err = service.VerifyPassword(hash, password+"wrong")
			if err == nil {
				t.Errorf("VerifyPassword() should have failed for incorrect password")
			}
		})
	}
}