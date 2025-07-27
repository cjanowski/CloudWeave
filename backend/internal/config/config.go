package config

import (
	"os"
	"strconv"
	"strings"
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
	JWTSecret         string
	JWTExpirationTime time.Duration
	JWTRefreshTime    time.Duration

	// Security
	BCryptRounds int
	CORSOrigins  []string

	// SSO Configuration
	SSO SSOConfig
}

type SSOConfig struct {
	// OAuth Configuration
	OAuth OAuthConfig

	// SAML Configuration
	SAML SAMLConfig
}

type OAuthConfig struct {
	Enabled   bool
	Google    OAuthProvider
	Microsoft OAuthProvider
	GitHub    OAuthProvider
	Generic   OAuthProvider
}

type OAuthProvider struct {
	Enabled      bool
	ClientID     string
	ClientSecret string
	RedirectURL  string
	Scopes       []string
	AuthURL      string
	TokenURL     string
	UserInfoURL  string
}

type SAMLConfig struct {
	Enabled         bool
	EntityID        string
	SSOURL          string
	X509Certificate string
	PrivateKey      string
	MetadataURL     string
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

		// SSO
		SSO: loadSSOConfig(),
	}
}

func loadSSOConfig() SSOConfig {
	return SSOConfig{
		OAuth: OAuthConfig{
			Enabled: getEnvBool("SSO_OAUTH_ENABLED", false),
			Google: OAuthProvider{
				Enabled:      getEnvBool("SSO_GOOGLE_ENABLED", false),
				ClientID:     getEnv("SSO_GOOGLE_CLIENT_ID", ""),
				ClientSecret: getEnv("SSO_GOOGLE_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("SSO_GOOGLE_REDIRECT_URL", ""),
				Scopes:       []string{"openid", "profile", "email"},
				AuthURL:      "https://accounts.google.com/o/oauth2/auth",
				TokenURL:     "https://oauth2.googleapis.com/token",
				UserInfoURL:  "https://www.googleapis.com/oauth2/v2/userinfo",
			},
			Microsoft: OAuthProvider{
				Enabled:      getEnvBool("SSO_MICROSOFT_ENABLED", false),
				ClientID:     getEnv("SSO_MICROSOFT_CLIENT_ID", ""),
				ClientSecret: getEnv("SSO_MICROSOFT_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("SSO_MICROSOFT_REDIRECT_URL", ""),
				Scopes:       []string{"openid", "profile", "email"},
				AuthURL:      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
				TokenURL:     "https://login.microsoftonline.com/common/oauth2/v2.0/token",
				UserInfoURL:  "https://graph.microsoft.com/v1.0/me",
			},
			GitHub: OAuthProvider{
				Enabled:      getEnvBool("SSO_GITHUB_ENABLED", false),
				ClientID:     getEnv("SSO_GITHUB_CLIENT_ID", ""),
				ClientSecret: getEnv("SSO_GITHUB_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("SSO_GITHUB_REDIRECT_URL", ""),
				Scopes:       []string{"user:email"},
				AuthURL:      "https://github.com/login/oauth/authorize",
				TokenURL:     "https://github.com/login/oauth/access_token",
				UserInfoURL:  "https://api.github.com/user",
			},
			Generic: OAuthProvider{
				Enabled:      getEnvBool("SSO_GENERIC_ENABLED", false),
				ClientID:     getEnv("SSO_GENERIC_CLIENT_ID", ""),
				ClientSecret: getEnv("SSO_GENERIC_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("SSO_GENERIC_REDIRECT_URL", ""),
				Scopes:       getEnvSlice("SSO_GENERIC_SCOPES", []string{"openid", "profile", "email"}),
				AuthURL:      getEnv("SSO_GENERIC_AUTH_URL", ""),
				TokenURL:     getEnv("SSO_GENERIC_TOKEN_URL", ""),
				UserInfoURL:  getEnv("SSO_GENERIC_USERINFO_URL", ""),
			},
		},
		SAML: SAMLConfig{
			Enabled:         getEnvBool("SSO_SAML_ENABLED", false),
			EntityID:        getEnv("SSO_SAML_ENTITY_ID", ""),
			SSOURL:          getEnv("SSO_SAML_SSO_URL", ""),
			X509Certificate: getEnv("SSO_SAML_X509_CERT", ""),
			PrivateKey:      getEnv("SSO_SAML_PRIVATE_KEY", ""),
			MetadataURL:     getEnv("SSO_SAML_METADATA_URL", ""),
		},
	}
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getEnvSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		return strings.Split(value, ",")
	}
	return defaultValue
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
