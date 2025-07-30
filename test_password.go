package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	// The hash from the database
	hash := "$2a$12$otAHDAtMT7e4f.imLn0HSuCCyiu1BsC3BS7vA3G/m8CKPd6azapem"
	password := "password123"

	// Test password verification
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		fmt.Printf("Password verification failed: %v\n", err)
	} else {
		fmt.Println("Password verification successful!")
	}

	// Also test generating a new hash for comparison
	newHash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		fmt.Printf("Failed to generate hash: %v\n", err)
	} else {
		fmt.Printf("New hash: %s\n", string(newHash))
	}
}
