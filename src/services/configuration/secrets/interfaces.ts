import {
  Secret,
  SecretVersion,
  SecretFilter,
  SecretUpdate,
  SecretRotationConfig,
  SecretAuditLog,
  SecretAccessPolicy,
  SecretMetadata
} from './types';

export interface ISecretsService {
  // Secret CRUD operations
  createSecret(secret: Omit<Secret, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Secret>;
  getSecret(id: string): Promise<Secret | null>;
  getSecretByPath(path: string): Promise<Secret | null>;
  updateSecret(id: string, update: SecretUpdate): Promise<Secret>;
  deleteSecret(id: string): Promise<void>;
  
  // Secret value operations
  getSecretValue(id: string): Promise<string>;
  setSecretValue(id: string, value: string, metadata?: SecretMetadata): Promise<SecretVersion>;
  
  // Secret querying
  listSecrets(filter?: SecretFilter): Promise<Secret[]>;
  searchSecrets(query: string, filter?: SecretFilter): Promise<Secret[]>;
  
  // Versioning
  getSecretVersions(secretId: string): Promise<SecretVersion[]>;
  getSecretVersion(secretId: string, version: number): Promise<SecretVersion | null>;
  rollbackSecret(secretId: string, targetVersion: number, reason: string): Promise<Secret>;
  
  // Rotation
  rotateSecret(secretId: string): Promise<Secret>;
  scheduleRotation(secretId: string, config: SecretRotationConfig): Promise<void>;
  cancelRotation(secretId: string): Promise<void>;
  
  // Access control
  grantAccess(secretId: string, policy: SecretAccessPolicy): Promise<void>;
  revokeAccess(secretId: string, principalId: string): Promise<void>;
  checkAccess(secretId: string, principalId: string, action: string): Promise<boolean>;
  
  // Audit
  getAuditLogs(secretId: string, limit?: number): Promise<SecretAuditLog[]>;
  logAccess(secretId: string, principalId: string, action: string, success: boolean): Promise<void>;
}

export interface IVaultConnector {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Secret operations
  writeSecret(path: string, data: Record<string, any>, metadata?: Record<string, any>): Promise<void>;
  readSecret(path: string, version?: number): Promise<{ data: Record<string, any>; metadata: Record<string, any> } | null>;
  deleteSecret(path: string): Promise<void>;
  listSecrets(path: string): Promise<string[]>;
  
  // Versioning
  getSecretVersions(path: string): Promise<Array<{ version: number; createdAt: Date; deletedAt?: Date }>>;
  destroySecretVersion(path: string, version: number): Promise<void>;
  
  // Metadata operations
  getSecretMetadata(path: string): Promise<Record<string, any> | null>;
  updateSecretMetadata(path: string, metadata: Record<string, any>): Promise<void>;
  
  // Policy operations
  createPolicy(name: string, policy: string): Promise<void>;
  updatePolicy(name: string, policy: string): Promise<void>;
  deletePolicy(name: string): Promise<void>;
  getPolicy(name: string): Promise<string | null>;
  
  // Token operations
  createToken(policies: string[], ttl?: string): Promise<{ token: string; accessor: string }>;
  revokeToken(token: string): Promise<void>;
  renewToken(token: string, increment?: string): Promise<void>;
}

export interface ISecretsRepository {
  // Secret persistence
  create(secret: Omit<Secret, 'id' | 'createdAt' | 'updatedAt'>): Promise<Secret>;
  findById(id: string): Promise<Secret | null>;
  findByPath(path: string): Promise<Secret | null>;
  update(id: string, updates: Partial<Secret>): Promise<Secret>;
  delete(id: string): Promise<void>;
  
  // Querying
  findMany(filter?: SecretFilter): Promise<Secret[]>;
  search(query: string, filter?: SecretFilter): Promise<Secret[]>;
  
  // Versioning
  createVersion(version: Omit<SecretVersion, 'id' | 'createdAt'>): Promise<SecretVersion>;
  findVersions(secretId: string): Promise<SecretVersion[]>;
  findVersion(secretId: string, version: number): Promise<SecretVersion | null>;
  
  // Audit logging
  createAuditLog(log: Omit<SecretAuditLog, 'id' | 'timestamp'>): Promise<SecretAuditLog>;
  findAuditLogs(secretId: string, limit?: number): Promise<SecretAuditLog[]>;
}

export interface ISecretRotationService {
  // Rotation operations
  rotateSecret(secretId: string): Promise<void>;
  scheduleRotation(secretId: string, config: SecretRotationConfig): Promise<void>;
  cancelRotation(secretId: string): Promise<void>;
  
  // Rotation status
  getRotationStatus(secretId: string): Promise<{ scheduled: boolean; nextRotation?: Date; lastRotation?: Date }>;
  listPendingRotations(): Promise<Array<{ secretId: string; scheduledAt: Date }>>;
  
  // Rotation handlers
  registerRotationHandler(type: string, handler: (secret: Secret) => Promise<string>): void;
  unregisterRotationHandler(type: string): void;
}

export interface ISecretAccessControl {
  // Policy management
  createPolicy(policy: SecretAccessPolicy): Promise<void>;
  updatePolicy(policyId: string, updates: Partial<SecretAccessPolicy>): Promise<void>;
  deletePolicy(policyId: string): Promise<void>;
  getPolicy(policyId: string): Promise<SecretAccessPolicy | null>;
  
  // Access control
  grantAccess(secretId: string, principalId: string, permissions: string[]): Promise<void>;
  revokeAccess(secretId: string, principalId: string): Promise<void>;
  checkPermission(secretId: string, principalId: string, permission: string): Promise<boolean>;
  
  // Principal management
  listPrincipals(secretId: string): Promise<Array<{ principalId: string; permissions: string[] }>>;
}