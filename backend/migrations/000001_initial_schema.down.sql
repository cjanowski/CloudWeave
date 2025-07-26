-- Drop triggers
DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
DROP TRIGGER IF EXISTS update_deployments_updated_at ON deployments;
DROP TRIGGER IF EXISTS update_infrastructure_updated_at ON infrastructure;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_alerts_severity;
DROP INDEX IF EXISTS idx_alerts_acknowledged;
DROP INDEX IF EXISTS idx_alerts_organization_id;
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_organization_id;
DROP INDEX IF EXISTS idx_metrics_timestamp;
DROP INDEX IF EXISTS idx_metrics_resource_type;
DROP INDEX IF EXISTS idx_metrics_resource_id;
DROP INDEX IF EXISTS idx_deployments_environment;
DROP INDEX IF EXISTS idx_deployments_status;
DROP INDEX IF EXISTS idx_deployments_organization_id;
DROP INDEX IF EXISTS idx_infrastructure_provider;
DROP INDEX IF EXISTS idx_infrastructure_status;
DROP INDEX IF EXISTS idx_infrastructure_organization_id;
DROP INDEX IF EXISTS idx_users_organization_id;
DROP INDEX IF EXISTS idx_users_email;

-- Drop tables in reverse order of creation (respecting foreign key constraints)
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS metrics;
DROP TABLE IF EXISTS deployments;
DROP TABLE IF EXISTS infrastructure;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS organizations;

-- Drop extensions
DROP EXTENSION IF EXISTS "uuid-ossp";