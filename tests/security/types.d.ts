/**
 * TypeScript declarations for security tests
 */

/// <reference types="jest" />
/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      TEST_BASE_URL?: string;
      SECURITY_TEST_MODE?: string;
      VULNERABILITY_SCANNING?: string;
      COMPLIANCE_TESTING?: string;
      DATABASE_ENCRYPTION?: string;
      FILE_ENCRYPTION?: string;
      HTTPS_ONLY?: string;
      TLS_VERSION?: string;
      DATA_RETENTION_DAYS?: string;
      BACKUP_ENABLED?: string;
      BACKUP_FREQUENCY?: string;
      FIREWALL_ENABLED?: string;
      NETWORK_SEGMENTATION?: string;
      SCAN_FREQUENCY?: string;
    }
  }
}

export {};