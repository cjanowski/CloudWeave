import { SecretsService, SecretRotationService, SecretAccessControl } from './SecretsService';
import { VaultConnector } from './VaultConnector';
import { SecretsRepository } from './SecretsRepository';
import {
  Secret,
  SecretVersion,
  SecretRotationConfig,
  SecretAccessPolicy,
  VaultConfig,
} from './types';

// Mock dependencies
jest.mock('./VaultConnector');
jest.mock('./SecretsRepository');

describe('SecretsService', () => {
  let secretsService: SecretsService;
  let mockVaultConnector: jest.Mocked<VaultConnector>;
  let mockRepository: jest.Mocked<SecretsRepository>;
  let mockRotationService: jest.Mocked<SecretRotationService>;
  let mockAccessControl: jest.Mocked<SecretAccessControl>;

  const mockSecret: Secret = {
    id: 'secret-1',
    name: 'test-secret',
    path: 'environments/env-1/secrets/test-secret',
    type: 'password',
    description: 'Test secret',
    environmentId: 'env-1',
    version: 1,
    accessPolicies: [],
    tags: {},
    metadata: {
      size: 32,
      encoding: 'utf8',
      checksum: 'abc123',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
  };

  beforeEach(() => {
    mockVaultConnector = new VaultConnector({} as VaultConfig) as jest.Mocked<VaultConnector>;
    mockRepository = new SecretsRepository({} as any) as jest.Mocked<SecretsRepository>;
    mockRotationService = {} as jest.Mocked<SecretRotationService>;
    mockAccessControl = {} as jest.Mocked<SecretAccessControl>;

    secretsService = new SecretsService(
      mockVaultConnector,
      mockRepository,
      mockRotationService,
      mockAccessControl
    );
  });

  describe('createSecret', () => {
    it('should create a new secret successfully', async () => {
      const secretData = {
        name: 'test-secret',
        type: 'password' as const,
        description: 'Test secret',
        environmentId: 'env-1',
        accessPolicies: [],
        tags: {},
        metadata: {
          size: 32,
          encoding: 'utf8' as const,
          checksum: 'abc123',
        },
        createdBy: 'user-1',
      };

      mockRepository.create.mockResolvedValue(mockSecret);
      mockRepository.createAuditLog.mockResolvedValue({} as any);

      const result = await secretsService.createSecret(secretData);

      expect(result).toEqual(mockSecret);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...secretData,
          id: expect.any(String),
          path: expect.stringContaining('environments/env-1/secrets/test-secret'),
          version: 1,
        })
      );
      expect(mockRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          principalId: 'user-1',
          success: true,
        })
      );
    });
  });

  describe('getSecretValue', () => {
    it('should retrieve secret value from Vault', async () => {
      const secretValue = 'super-secret-password';
      
      mockRepository.findById.mockResolvedValue(mockSecret);
      mockVaultConnector.readSecret.mockResolvedValue({
        data: { value: secretValue },
        metadata: {},
      });
      mockRepository.update.mockResolvedValue(mockSecret);
      mockRepository.createAuditLog.mockResolvedValue({} as any);

      const result = await secretsService.getSecretValue('secret-1');

      expect(result).toBe(secretValue);
      expect(mockVaultConnector.readSecret).toHaveBeenCalledWith(mockSecret.path);
      expect(mockRepository.update).toHaveBeenCalledWith('secret-1', {
        lastAccessedAt: expect.any(Date),
      });
      expect(mockRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'read',
          success: true,
        })
      );
    });

    it('should throw error if secret not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(secretsService.getSecretValue('nonexistent')).rejects.toThrow(
        'Secret with ID nonexistent not found'
      );
    });

    it('should log failed access attempt', async () => {
      mockRepository.findById.mockResolvedValue(mockSecret);
      mockVaultConnector.readSecret.mockRejectedValue(new Error('Vault error'));
      mockRepository.createAuditLog.mockResolvedValue({} as any);

      await expect(secretsService.getSecretValue('secret-1')).rejects.toThrow();

      expect(mockRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'read',
          success: false,
        })
      );
    });
  });

  describe('setSecretValue', () => {
    it('should store new secret value in Vault and create version', async () => {
      const newValue = 'new-secret-value';
      const newVersion: SecretVersion = {
        id: 'version-1',
        secretId: 'secret-1',
        version: 2,
        valueHash: 'def456',
        metadata: {
          size: 16,
          encoding: 'utf8',
          checksum: 'def456',
        },
        createdAt: new Date(),
        createdBy: 'system',
        isActive: true,
      };

      mockRepository.findById.mockResolvedValue(mockSecret);
      mockVaultConnector.writeSecret.mockResolvedValue();
      mockRepository.createVersion.mockResolvedValue(newVersion);
      mockRepository.update.mockResolvedValue({ ...mockSecret, version: 2 });
      mockRepository.createAuditLog.mockResolvedValue({} as any);

      const result = await secretsService.setSecretValue('secret-1', newValue);

      expect(result).toEqual(newVersion);
      expect(mockVaultConnector.writeSecret).toHaveBeenCalledWith(
        mockSecret.path,
        { value: newValue },
        expect.objectContaining({
          size: 16,
          encoding: 'utf8',
          checksum: expect.any(String),
        })
      );
      expect(mockRepository.createVersion).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith('secret-1', {
        version: 2,
        metadata: expect.any(Object),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('rollbackSecret', () => {
    it('should rollback secret to previous version', async () => {
      const targetVersion = 1;
      const targetVersionRecord: SecretVersion = {
        id: 'version-1',
        secretId: 'secret-1',
        version: targetVersion,
        valueHash: 'abc123',
        metadata: mockSecret.metadata,
        createdAt: new Date(),
        createdBy: 'user-1',
        isActive: false,
      };
      const oldValue = 'old-secret-value';

      mockRepository.findById.mockResolvedValue({ ...mockSecret, version: 2 });
      mockRepository.findVersion.mockResolvedValue(targetVersionRecord);
      mockVaultConnector.readSecret.mockResolvedValue({
        data: { value: oldValue },
        metadata: {},
      });
      mockVaultConnector.writeSecret.mockResolvedValue();
      mockRepository.createVersion.mockResolvedValue({} as any);
      mockRepository.update.mockResolvedValue({ ...mockSecret, version: 3 });
      mockRepository.createAuditLog.mockResolvedValue({} as any);

      const result = await secretsService.rollbackSecret('secret-1', targetVersion, 'Rollback test');

      expect(mockVaultConnector.readSecret).toHaveBeenCalledWith(mockSecret.path, targetVersion);
      expect(mockVaultConnector.writeSecret).toHaveBeenCalledWith(
        mockSecret.path,
        { value: oldValue },
        expect.any(Object)
      );
    });

    it('should throw error if target version not found', async () => {
      mockRepository.findById.mockResolvedValue(mockSecret);
      mockRepository.findVersion.mockResolvedValue(null);

      await expect(
        secretsService.rollbackSecret('secret-1', 999, 'Invalid rollback')
      ).rejects.toThrow('Version 999 not found for secret secret-1');
    });
  });

  describe('deleteSecret', () => {
    it('should delete secret from both Vault and database', async () => {
      mockRepository.findById.mockResolvedValue(mockSecret);
      mockVaultConnector.deleteSecret.mockResolvedValue();
      mockRepository.delete.mockResolvedValue();
      mockRepository.createAuditLog.mockResolvedValue({} as any);

      await secretsService.deleteSecret('secret-1');

      expect(mockVaultConnector.deleteSecret).toHaveBeenCalledWith(mockSecret.path);
      expect(mockRepository.delete).toHaveBeenCalledWith('secret-1');
      expect(mockRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'delete',
          success: true,
        })
      );
    });

    it('should continue with database deletion even if Vault deletion fails', async () => {
      mockRepository.findById.mockResolvedValue(mockSecret);
      mockVaultConnector.deleteSecret.mockRejectedValue(new Error('Vault error'));
      mockRepository.delete.mockResolvedValue();
      mockRepository.createAuditLog.mockResolvedValue({} as any);

      // Should not throw error
      await secretsService.deleteSecret('secret-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('secret-1');
    });
  });
});

describe('SecretRotationService', () => {
  let rotationService: SecretRotationService;
  let mockSecretsService: jest.Mocked<SecretsService>;
  let mockRepository: jest.Mocked<SecretsRepository>;

  const mockSecret: Secret = {
    id: 'secret-1',
    name: 'test-secret',
    path: 'environments/env-1/secrets/test-secret',
    type: 'password',
    description: 'Test secret',
    environmentId: 'env-1',
    version: 1,
    rotationConfig: {
      enabled: true,
      interval: 30,
      type: 'password',
      notifyBefore: 7,
      autoRotate: true,
    },
    accessPolicies: [],
    tags: {},
    metadata: {
      size: 32,
      encoding: 'utf8',
      checksum: 'abc123',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
  };

  beforeEach(() => {
    mockSecretsService = {} as jest.Mocked<SecretsService>;
    mockRepository = new SecretsRepository({} as any) as jest.Mocked<SecretsRepository>;

    rotationService = new SecretRotationService(mockSecretsService, mockRepository);
  });

  describe('rotateSecret', () => {
    it('should rotate password secret successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockSecret);
      mockSecretsService.setSecretValue.mockResolvedValue({} as any);
      mockRepository.update.mockResolvedValue(mockSecret);

      await rotationService.rotateSecret('secret-1');

      expect(mockSecretsService.setSecretValue).toHaveBeenCalledWith(
        'secret-1',
        expect.any(String)
      );
      expect(mockRepository.update).toHaveBeenCalledWith('secret-1', {
        lastRotatedAt: expect.any(Date),
      });
    });

    it('should throw error if rotation is not enabled', async () => {
      const secretWithoutRotation = {
        ...mockSecret,
        rotationConfig: { ...mockSecret.rotationConfig!, enabled: false },
      };
      mockRepository.findById.mockResolvedValue(secretWithoutRotation);

      await expect(rotationService.rotateSecret('secret-1')).rejects.toThrow(
        'Rotation is not enabled for secret secret-1'
      );
    });

    it('should throw error if no rotation handler found', async () => {
      const secretWithCustomType = {
        ...mockSecret,
        rotationConfig: { ...mockSecret.rotationConfig!, type: 'unknown_type' },
      };
      mockRepository.findById.mockResolvedValue(secretWithCustomType);

      await expect(rotationService.rotateSecret('secret-1')).rejects.toThrow(
        'No rotation handler found for type unknown_type'
      );
    });
  });

  describe('scheduleRotation', () => {
    it('should schedule automatic rotation', async () => {
      const config: SecretRotationConfig = {
        enabled: true,
        interval: 1, // 1 day for testing
        type: 'password',
        notifyBefore: 1,
        autoRotate: true,
      };

      await rotationService.scheduleRotation('secret-1', config);

      // Verify that rotation is scheduled (timeout is set)
      const status = await rotationService.getRotationStatus('secret-1');
      expect(status.scheduled).toBe(true);
    });

    it('should not schedule if autoRotate is false', async () => {
      const config: SecretRotationConfig = {
        enabled: true,
        interval: 30,
        type: 'password',
        notifyBefore: 7,
        autoRotate: false,
      };

      await rotationService.scheduleRotation('secret-1', config);

      const status = await rotationService.getRotationStatus('secret-1');
      expect(status.scheduled).toBe(false);
    });
  });

  describe('registerRotationHandler', () => {
    it('should register custom rotation handler', async () => {
      const customHandler = jest.fn().mockResolvedValue('custom-generated-value');
      
      rotationService.registerRotationHandler('custom', customHandler);

      const secretWithCustomType = {
        ...mockSecret,
        rotationConfig: { ...mockSecret.rotationConfig!, type: 'custom' },
      };
      mockRepository.findById.mockResolvedValue(secretWithCustomType);
      mockSecretsService.setSecretValue.mockResolvedValue({} as any);
      mockRepository.update.mockResolvedValue(mockSecret);

      await rotationService.rotateSecret('secret-1');

      expect(customHandler).toHaveBeenCalledWith(secretWithCustomType);
      expect(mockSecretsService.setSecretValue).toHaveBeenCalledWith(
        'secret-1',
        'custom-generated-value'
      );
    });
  });
});

describe('VaultConnector', () => {
  let vaultConnector: VaultConnector;
  let mockAxios: any;

  const mockConfig: VaultConfig = {
    endpoint: 'https://vault.example.com',
    token: 'test-token',
    mountPath: 'secret',
  };

  beforeEach(() => {
    mockAxios = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: { headers: { common: {} } },
    };

    // Mock axios.create to return our mock
    jest.doMock('axios', () => ({
      create: jest.fn(() => mockAxios),
    }));

    vaultConnector = new VaultConnector(mockConfig);
  });

  describe('connect', () => {
    it('should connect successfully with token authentication', async () => {
      mockAxios.get.mockResolvedValue({ data: {} });

      await vaultConnector.connect();

      expect(vaultConnector.isConnected()).toBe(true);
      expect(mockAxios.defaults.headers.common['X-Vault-Token']).toBe('test-token');
      expect(mockAxios.get).toHaveBeenCalledWith('/v1/sys/health');
    });

    it('should throw error if health check fails', async () => {
      mockAxios.get.mockRejectedValue(new Error('Connection failed'));

      await expect(vaultConnector.connect()).rejects.toThrow(
        'Failed to connect to Vault: Connection failed'
      );
      expect(vaultConnector.isConnected()).toBe(false);
    });
  });

  describe('writeSecret', () => {
    beforeEach(async () => {
      mockAxios.get.mockResolvedValue({ data: {} });
      await vaultConnector.connect();
    });

    it('should write secret to Vault', async () => {
      mockAxios.post.mockResolvedValue({ data: {} });

      const data = { value: 'secret-value' };
      const metadata = { created_by: 'user-1' };

      await vaultConnector.writeSecret('test/path', data, metadata);

      expect(mockAxios.post).toHaveBeenCalledWith('/v1/secret/data/test/path', {
        data,
        metadata,
      });
    });

    it('should throw error if write fails', async () => {
      mockAxios.post.mockRejectedValue(new Error('Write failed'));

      await expect(
        vaultConnector.writeSecret('test/path', { value: 'test' })
      ).rejects.toThrow('Failed to write secret at test/path: Write failed');
    });
  });

  describe('readSecret', () => {
    beforeEach(async () => {
      mockAxios.get.mockResolvedValue({ data: {} });
      await vaultConnector.connect();
    });

    it('should read secret from Vault', async () => {
      const mockResponse = {
        data: {
          data: {
            data: { value: 'secret-value' },
            metadata: { version: 1 },
          },
        },
      };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await vaultConnector.readSecret('test/path');

      expect(result).toEqual({
        data: { value: 'secret-value' },
        metadata: { version: 1 },
      });
      expect(mockAxios.get).toHaveBeenCalledWith('/v1/secret/data/test/path', { params: {} });
    });

    it('should return null if secret not found', async () => {
      mockAxios.get.mockRejectedValue({ response: { status: 404 } });

      const result = await vaultConnector.readSecret('nonexistent/path');

      expect(result).toBeNull();
    });

    it('should read specific version', async () => {
      const mockResponse = {
        data: {
          data: {
            data: { value: 'old-secret-value' },
            metadata: { version: 1 },
          },
        },
      };
      mockAxios.get.mockResolvedValue(mockResponse);

      await vaultConnector.readSecret('test/path', 1);

      expect(mockAxios.get).toHaveBeenCalledWith('/v1/secret/data/test/path', {
        params: { version: '1' },
      });
    });
  });
});