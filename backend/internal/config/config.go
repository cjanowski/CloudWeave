package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Environment string
	Port        string
	
	// Database
	DatabaseURL      string
	DatabaseHost     string
	DatabasePort     string
	DatabaseName     string
	DatabaseUser     string
	DatabasePassword string
	DatabaseSSLMode  string
	
	// JWT
	JWTSecret           string
	JWTExpirationTime   time.Duration
	JWTRefreshTime      time.Duration
	
	// Security
	BCryptRounds int
	CORSOrigins  []string
}

func Load() *Config {
	jwtExpiration, _ := time.ParseDuration(getEnv("JWT_EXPIRES_IN", "15m"))
	jwtRefreshExpiration, _ := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRES_IN", "168h")) // 7 days
	bcryptRounds, _ := strconv.Atoi(getEnv("BCRYPT_ROUNDS", "12"))

	return &Config{
		Environment: getEnv("NODE_ENV", "development"),
		Port:        getEnv("PORT", "3001"),
		
		// Database
		DatabaseURL:      getEnv("DATABASE_URL", ""),
		DatabaseHost:     getEnv("DB_HOST", "localhost"),
		DatabasePort:     getEnv("DB_PORT", "5432"),
		DatabaseName:     getEnv("DB_NAME", "cloud_platform_db"),
		DatabaseUser:     getEnv("DB_USER", "coryjanowski"),
		DatabasePassword: getEnv("DB_PASSWORD", ""),
		DatabaseSSLMode:  getEnv("DB_SSL_MODE", "disable"),
		
		// JWT
		JWTSecret:         getEnv("JWT_SECRET", "your-super-secret-jwt-key-that-should-be-changed-in-production"),
		JWTExpirationTime: jwtExpiration,
		JWTRefreshTime:    jwtRefreshExpiration,
		
		// Security
		BCryptRounds: bcryptRounds,
		CORSOrigins:  []string{getEnv("CORS_ORIGIN", "*")},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}