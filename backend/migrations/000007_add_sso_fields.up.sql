-- Add SSO fields to users table
ALTER TABLE users 
ADD COLUMN sso_provider VARCHAR(50),
ADD COLUMN sso_subject VARCHAR(255);

-- Make password_hash nullable for SSO users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Create index for SSO lookups
CREATE INDEX idx_users_sso_provider_subject ON users(sso_provider, sso_subject);