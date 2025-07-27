-- Drop triggers
DROP TRIGGER IF EXISTS update_vulnerabilities_updated_at ON vulnerabilities;
DROP TRIGGER IF EXISTS update_security_scans_updated_at ON security_scans;

-- Drop indexes
DROP INDEX IF EXISTS idx_vulnerabilities_created_at;
DROP INDEX IF EXISTS idx_vulnerabilities_cve_id;
DROP INDEX IF EXISTS idx_vulnerabilities_resource;
DROP INDEX IF EXISTS idx_vulnerabilities_status;
DROP INDEX IF EXISTS idx_vulnerabilities_severity;
DROP INDEX IF EXISTS idx_vulnerabilities_scan_id;
DROP INDEX IF EXISTS idx_vulnerabilities_organization_id;

DROP INDEX IF EXISTS idx_security_scans_target;
DROP INDEX IF EXISTS idx_security_scans_created_at;
DROP INDEX IF EXISTS idx_security_scans_type;
DROP INDEX IF EXISTS idx_security_scans_status;
DROP INDEX IF EXISTS idx_security_scans_user_id;
DROP INDEX IF EXISTS idx_security_scans_organization_id;

-- Drop tables
DROP TABLE IF EXISTS vulnerabilities;
DROP TABLE IF EXISTS security_scans;