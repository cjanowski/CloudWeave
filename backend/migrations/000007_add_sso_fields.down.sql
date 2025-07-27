-- Remove SSO fields from users table
DROP INDEX IF EXISTS idx_users_sso_provider_subject;
ALTER TABLE users DROP COLUMN IF EXISTS sso_provider;
ALTER TABLE users DROP COLUMN IF EXISTS sso_subject;

-- Make password_hash required again (this might fail if there are SSO users)
-- ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;