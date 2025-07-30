-- Remove demo-related fields from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS onboarding_completed,
DROP COLUMN IF EXISTS demo_mode,
DROP COLUMN IF EXISTS demo_scenario,
DROP COLUMN IF EXISTS is_active,
DROP COLUMN IF EXISTS sso_provider,
DROP COLUMN IF EXISTS sso_subject;

-- Drop demo_data table
DROP TABLE IF EXISTS demo_data;

-- Remove demo metadata from existing tables
ALTER TABLE infrastructure DROP COLUMN IF EXISTS is_demo;
ALTER TABLE deployments DROP COLUMN IF EXISTS is_demo;
ALTER TABLE metrics DROP COLUMN IF EXISTS is_demo;
ALTER TABLE alerts DROP COLUMN IF EXISTS is_demo;