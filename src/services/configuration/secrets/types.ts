export interface Secret {
  id: string;
  name: string;
  path: string;
  type: SecretType;
  description?: string;
  environmentId: string;
  version: number;
  rotationConfig?: SecretRotationConfig;
  accessPolicies: string[];
  tags: Record<string, string>;
  metadata: SecretMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastAccessedAt?: Date;
  lastRotatedAt?: Date;
}

export interface SecretVersion {
  id: string;
  secretId: string;
  version: number;
  valueHash: string; // Hash of the secret value for integrity checking
  metadata: SecretMetadata;
  createdAt: Date;
  createdBy: string;
  expiresAt?: Date;
  isActive: boolean;
}

export interface SecretMetadata {
  size: number;
  encoding: 'utf8' | 'base64';
  contentType?: string;
  checksum: string;
  customFields?: Record<string, any>;
}

export interface SecretRotationConfig {
  enabled: boolean;
  interval: number; // in days
  type: RotationType;
  notifyBefore: number; // days before rotation to notify
  autoRotate: boolean;
  rotationHandler?: string; // custom rotation handler identifier
  settings?: Record<string, any>; // rotation-specific settings
}

export interface SecretAuditLog {
  id: string;
  secretId: string;
  action: SecretAction;
  principalId: string;
  principalType: 'user' | 'service' | 'system';
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface SecretAccessPolicy {
  id: string;
  name: string;
  secretId: string;
  principalId: string;
  principalType: 'user' | 'role' | 'service';
  permissions: SecretPermission[];
  conditions?: AccessCondition[];
  expiresAt?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface AccessCondition {
  type: 'ip_range' | 'time_window' | 'environment' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'matches';
  value: any;
}

export type SecretType = 
  | 'password'
  | 'api_key'
  | 'certificate'
  | 'private_key'
  | 'database_credential'
  | 'oauth_token'
  | 'custom';

export type RotationType = 
  | 'manual'
  | 'automatic'
  | 'database_password'
  | 'api_key'
  | 'certificate'
  | 'custom';

export type SecretAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'rotate'
  | 'grant_access'
  | 'revoke_access'
  | 'list'
  | 'export';

export type SecretPermission = 
  | 'read'
  | 'write'
  | 'delete'
  | 'rotate'
  | 'manage_access'
  | 'audit';

export interface SecretFilter {
  environmentId?: string;
  name?: string;
  path?: string;
  type?: SecretType;
  tags?: Record<string, string>;
  createdBy?: string;
  lastAccessedAfter?: Date;
  lastAccessedBefore?: Date;
  expiringBefore?: Date;
}

export interface SecretUpdate {
  name?: string;
  description?: string;
  rotationConfig?: SecretRotationConfig;
  tags?: Record<string, string>;
  metadata?: Partial<SecretMetadata>;
}

export interface VaultConfig {
  endpoint: string;
  token?: string;
  roleId?: string;
  secretId?: string;
  namespace?: string;
  mountPath: string;
  tlsConfig?: {
    caCert?: string;
    clientCert?: string;
    clientKey?: string;
    insecure?: boolean;
  };
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  };
}

export interface SecretExportOptions {
  format: 'json' | 'yaml' | 'env';
  includeMetadata: boolean;
  maskValues: boolean;
  filter?: SecretFilter;
}

export interface SecretImportOptions {
  format: 'json' | 'yaml' | 'env';
  overwriteExisting: boolean;
  validateOnly: boolean;
  environmentId: string;
}

export interface SecretValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RotationResult {
  success: boolean;
  newVersion: number;
  oldVersion: number;
  rotatedAt: Date;
  error?: string;
}