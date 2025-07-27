-- Drop cloud credentials table
DROP TABLE IF EXISTS cloud_credentials;

-- Remove AWS credentials column from organizations
ALTER TABLE organizations DROP COLUMN IF EXISTS aws_credentials;

-- Drop index
DROP INDEX IF EXISTS idx_organizations_aws_credentials;