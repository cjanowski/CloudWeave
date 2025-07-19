import crypto from 'crypto';
import {
  ISecretsService,
  IVaultConnector,
  ISecretsRepository,
  ISecretRotationService,
  ISecretAccessControl,
} from './interfaces';
import {
  Secret,
  SecretVersion,
  SecretFilter,
  SecretUpdate,
  SecretRotationConfig,
  SecretAuditLog,
  SecretAccessPolicy,
  SecretMetadata,
  SecretAction,
} from './types';

export class SecretsService implements ISecretsService {
  constructor(
    private vaultConnector: IVaultConnector,
    private repository: ISecretsRepository,
    private rotationService: ISecretRotationService,
    private accessControl: ISecretAccessControl
  ) {}

  async createSecret(secret: Omit<Secret, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Secret> {
    // Generate unique ID and path
    const id = crypto.randomUUID();
    const path = this.generateSecretPath(secret.environmentId, secret.name);

    // Create secret record in database
    const newSecret = await this.repository.create({
      ...secret,
      id,
      path,
      version: 1,
    });

    // Log creation
    await this.logAccess(id, secret.createdBy, 'create', true);

    return newSecret;
  }

  async getSecret(id: string): Promise<Secret | null> {
    return await this.repository.findById(id);
  }

  async getSecretByPath(path: string): Promise<Secret | null> {
    return await this.repository.findByPath(path);
  }

  async updateSecret(id: string, update: SecretUpdate): Promise<Secret> {
    const secret = await this.repository.findById(id);
    if (!secret) {
      throw new Error(`Secret with ID ${id} not found`);
    }

    const updatedSecret = await this.repository.update(id, {
      ...update,
      updatedAt: new Date(),
    });

    // Log update
    await this.logAccess(id, 'system', 'update', true);

    return updatedSecret;
  }

  async deleteSecret(id: string): Promise<void> {
    const secret = await this.repository.findById(id);
    if (!secret) {
      throw new Error(`Secret with ID ${id} not found`);
    }

    // Delete from Vault
    try {
      await this.vaultConnector.deleteSecret(secret.path);
    } catch (error) {
      console.warn(`Failed to delete secret from Vault: ${error.message}`);
    }

    // Delete from database
    await this.repository.delete(id);

    // Log deletion
    await this.logAccess(id, 'system', 'delete', true);
  }

  async getSecretValue(id: string): Promise<string> {
    const secret = await this.repository.findById(id);
    if (!secret) {
      throw new Error(`Secret with ID ${id} not found`);
    }

    try {
      const result = await this.vaultConnector.readSecret(secret.path);
      if (!result) {
        throw new Error(`Secret value not found in Vault for path ${secret.path}`);
      }

      // Update last accessed timestamp
      await this.repository.update(id, {
        lastAccessedAt: new Date(),
      });

      // Log access
      await this.logAccess(id, 'system', 'read', true);

      return result.data.value;
    } catch (error) {
      await this.logAccess(id, 'system', 'read', false);
      throw new Error(`Failed to retrieve secret value: ${error.message}`);
    }
  }

  async setSecretValue(id: string, value: string, metadata?: SecretMetadata): Promise<SecretVersion> {
    const secret = await this.repository.findById(id);
    if (!secret) {
      throw new Error(`Secret with ID ${id} not found`);
    }

    // Calculate metadata
    const secretMetadata: SecretMetadata = {
      size: Buffer.byteLength(value, 'utf8'),
      encoding: 'utf8',
      checksum: this.calculateChecksum(value),
      ...metadata,
    };

    // Store in Vault
    await this.vaultConnector.writeSecret(
      secret.path,
      { value },
      { ...secretMetadata, updatedBy: 'system' }
    );

    // Create new version record
    const newVersion = secret.version + 1;
    const secretVersion = await this.repository.createVersion({
      secretId: id,
      version: newVersion,
      valueHash: this.calculateChecksum(value),
      metadata: secretMetadata,
      createdBy: 'system',
      isActive: true,
    });

    // Update secret version
    await this.repository.update(id, {
      version: newVersion,
      metadata: secretMetadata,
      updatedAt: new Date(),
    });

    // Log update
    await this.logAccess(id, 'system', 'update', true);

    return secretVersion;
  }

  async listSecrets(filter?: SecretFilter): Promise<Secret[]> {
    return await this.repository.findMany(filter);
  }

  async searchSecrets(query: string, filter?: SecretFilter): Promise<Secret[]> {
    return await this.repository.search(query, filter);
  }

  async getSecretVersions(secretId: string): Promise<SecretVersion[]> {
    return await this.repository.findVersions(secretId);
  }

  async getSecretVersion(secretId: string, version: number): Promise<SecretVersion | null> {
    return await this.repository.findVersion(secretId, version);
  }

  async rollbackSecret(secretId: string, targetVersion: number, reason: string): Promise<Secret> {
    const secret = await this.repository.findById(secretId);
    if (!secret) {
      throw new Error(`Secret with ID ${secretId} not found`);
    }

    const targetVersionRecord = await this.repository.findVersion(secretId, targetVersion);
    if (!targetVersionRecord) {
      throw new Error(`Version ${targetVersion} not found for secret ${secretId}`);
    }

    // Get the secret value from Vault for the target version
    const vaultResult = await this.vaultConnector.readSecret(secret.path, targetVersion);
    if (!vaultResult) {
      throw new Error(`Secret value not found in Vault for version ${targetVersion}`);
    }

    // Create new version with the rolled-back value
    await this.setSecretValue(secretId, vaultResult.data.value, targetVersionRecord.metadata);

    // Log rollback
    await this.logAccess(secretId, 'system', 'update', true);

    return await this.repository.findById(secretId) as Secret;
  }

  async rotateSecret(secretId: string): Promise<Secret> {
    await this.rotationService.rotateSecret(secretId);
    return await this.repository.findById(secretId) as Secret;
  }

  async scheduleRotation(secretId: string, config: SecretRotationConfig): Promise<void> {
    await this.rotationService.scheduleRotation(secretId, config);
  }

  async cancelRotation(secretId: string): Promise<void> {
    await this.rotationService.cancelRotation(secretId);
  }

  async grantAccess(secretId: string, policy: SecretAccessPolicy): Promise<void> {
    await this.accessControl.createPolicy(policy);
    await this.logAccess(secretId, policy.createdBy, 'grant_access', true);
  }

  async revokeAccess(secretId: string, principalId: string): Promise<void> {
    await this.accessControl.revokeAccess(secretId, principalId);
    await this.logAccess(secretId, 'system', 'revoke_access', true);
  }

  async checkAccess(secretId: string, principalId: string, action: string): Promise<boolean> {
    return await this.accessControl.checkPermission(secretId, principalId, action);
  }

  async getAuditLogs(secretId: string, limit?: number): Promise<SecretAuditLog[]> {
    return await this.repository.findAuditLogs(secretId, limit);
  }

  async logAccess(secretId: string, principalId: string, action: SecretAction, success: boolean): Promise<void> {
    await this.repository.createAuditLog({
      secretId,
      action,
      principalId,
      principalType: 'system', // This could be determined based on principalId
      success,
      timestamp: new Date(),
    });
  }

  private generateSecretPath(environmentId: string, name: string): string {
    // Generate a path like: environments/{environmentId}/secrets/{name}
    const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `environments/${environmentId}/secrets/${sanitizedName}`;
  }

  private calculateChecksum(value: string): string {
    return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
  }
}

export class SecretRotationService implements ISecretRotationService {
  private rotationHandlers = new Map<string, (secret: Secret) => Promise<string>>();
  private scheduledRotations = new Map<string, NodeJS.Timeout>();

  constructor(
    private secretsService: ISecretsService,
    private repository: ISecretsRepository
  ) {
    // Register default rotation handlers
    this.registerDefaultHandlers();
  }

  async rotateSecret(secretId: string): Promise<void> {
    const secret = await this.repository.findById(secretId);
    if (!secret) {
      throw new Error(`Secret with ID ${secretId} not found`);
    }

    if (!secret.rotationConfig?.enabled) {
      throw new Error(`Rotation is not enabled for secret ${secretId}`);
    }

    const handler = this.rotationHandlers.get(secret.rotationConfig.type);
    if (!handler) {
      throw new Error(`No rotation handler found for type ${secret.rotationConfig.type}`);
    }

    try {
      // Generate new secret value
      const newValue = await handler(secret);

      // Update secret with new value
      await this.secretsService.setSecretValue(secretId, newValue);

      // Update last rotation timestamp
      await this.repository.update(secretId, {
        lastRotatedAt: new Date(),
      });

      // Schedule next rotation if auto-rotation is enabled
      if (secret.rotationConfig.autoRotate) {
        await this.scheduleRotation(secretId, secret.rotationConfig);
      }
    } catch (error) {
      throw new Error(`Failed to rotate secret ${secretId}: ${error.message}`);
    }
  }

  async scheduleRotation(secretId: string, config: SecretRotationConfig): Promise<void> {
    // Cancel existing rotation if any
    await this.cancelRotation(secretId);

    if (!config.autoRotate) {
      return;
    }

    const intervalMs = config.interval * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    const timeout = setTimeout(async () => {
      try {
        await this.rotateSecret(secretId);
      } catch (error) {
        console.error(`Scheduled rotation failed for secret ${secretId}:`, error.message);
      }
    }, intervalMs);

    this.scheduledRotations.set(secretId, timeout);
  }

  async cancelRotation(secretId: string): Promise<void> {
    const timeout = this.scheduledRotations.get(secretId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledRotations.delete(secretId);
    }
  }

  async getRotationStatus(secretId: string): Promise<{ scheduled: boolean; nextRotation?: Date; lastRotation?: Date }> {
    const secret = await this.repository.findById(secretId);
    if (!secret) {
      throw new Error(`Secret with ID ${secretId} not found`);
    }

    const scheduled = this.scheduledRotations.has(secretId);
    let nextRotation: Date | undefined;

    if (scheduled && secret.rotationConfig?.autoRotate) {
      const intervalMs = secret.rotationConfig.interval * 24 * 60 * 60 * 1000;
      const lastRotation = secret.lastRotatedAt || secret.createdAt;
      nextRotation = new Date(lastRotation.getTime() + intervalMs);
    }

    return {
      scheduled,
      nextRotation,
      lastRotation: secret.lastRotatedAt,
    };
  }

  async listPendingRotations(): Promise<Array<{ secretId: string; scheduledAt: Date }>> {
    // This would typically query a database table for scheduled rotations
    // For now, return empty array as we're using in-memory scheduling
    return [];
  }

  registerRotationHandler(type: string, handler: (secret: Secret) => Promise<string>): void {
    this.rotationHandlers.set(type, handler);
  }

  unregisterRotationHandler(type: string): void {
    this.rotationHandlers.delete(type);
  }

  private registerDefaultHandlers(): void {
    // Password rotation handler
    this.registerRotationHandler('password', async (secret: Secret) => {
      const length = secret.rotationConfig?.settings?.length || 32;
      const charset = secret.rotationConfig?.settings?.charset || 
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      
      let result = '';
      for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return result;
    });

    // API key rotation handler
    this.registerRotationHandler('api_key', async (secret: Secret) => {
      // Generate a new API key (this is a simple example)
      const prefix = secret.rotationConfig?.settings?.prefix || 'ak_';
      const randomBytes = crypto.randomBytes(32).toString('hex');
      return `${prefix}${randomBytes}`;
    });
  }
}

export class SecretAccessControl implements ISecretAccessControl {
  constructor(
    private repository: ISecretsRepository,
    private vaultConnector: IVaultConnector
  ) {}

  async createPolicy(policy: SecretAccessPolicy): Promise<void> {
    // Create Vault policy
    const vaultPolicy = this.generateVaultPolicy(policy);
    await this.vaultConnector.createPolicy(policy.name, vaultPolicy);

    // Store policy metadata in database (if needed)
    // This would depend on your specific requirements
  }

  async updatePolicy(policyId: string, updates: Partial<SecretAccessPolicy>): Promise<void> {
    // Implementation would depend on how policies are stored
    throw new Error('Method not implemented');
  }

  async deletePolicy(policyId: string): Promise<void> {
    // Implementation would depend on how policies are stored
    throw new Error('Method not implemented');
  }

  async getPolicy(policyId: string): Promise<SecretAccessPolicy | null> {
    // Implementation would depend on how policies are stored
    throw new Error('Method not implemented');
  }

  async grantAccess(secretId: string, principalId: string, permissions: string[]): Promise<void> {
    // Implementation would create appropriate Vault policies and tokens
    throw new Error('Method not implemented');
  }

  async revokeAccess(secretId: string, principalId: string): Promise<void> {
    // Implementation would revoke Vault tokens and policies
    throw new Error('Method not implemented');
  }

  async checkPermission(secretId: string, principalId: string, permission: string): Promise<boolean> {
    // Implementation would check Vault policies
    throw new Error('Method not implemented');
  }

  async listPrincipals(secretId: string): Promise<Array<{ principalId: string; permissions: string[] }>> {
    // Implementation would list principals with access to the secret
    throw new Error('Method not implemented');
  }

  private generateVaultPolicy(policy: SecretAccessPolicy): string {
    const secret = policy.secretId; // This would need to be resolved to a path
    const capabilities = policy.permissions.map(p => this.mapPermissionToCapability(p));

    return `
path "${secret}" {
  capabilities = [${capabilities.map(c => `"${c}"`).join(', ')}]
}
    `.trim();
  }

  private mapPermissionToCapability(permission: string): string {
    const mapping: Record<string, string> = {
      'read': 'read',
      'write': 'create',
      'update': 'update',
      'delete': 'delete',
      'list': 'list',
    };

    return mapping[permission] || permission;
  }
}