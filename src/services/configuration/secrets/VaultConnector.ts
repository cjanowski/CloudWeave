import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { IVaultConnector, VaultConfig } from './types';

export class VaultConnector implements IVaultConnector {
  private client: AxiosInstance;
  private config: VaultConfig;
  private connected: boolean = false;
  private token?: string;

  constructor(config: VaultConfig) {
    this.config = config;
    this.client = this.createAxiosClient();
  }

  private createAxiosClient(): AxiosInstance {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: !this.config.tlsConfig?.insecure,
      ca: this.config.tlsConfig?.caCert,
      cert: this.config.tlsConfig?.clientCert,
      key: this.config.tlsConfig?.clientKey,
    });

    return axios.create({
      baseURL: this.config.endpoint,
      timeout: 30000,
      httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.namespace && { 'X-Vault-Namespace': this.config.namespace }),
      },
    });
  }

  async connect(): Promise<void> {
    try {
      // Authenticate with Vault
      if (this.config.token) {
        this.token = this.config.token;
      } else if (this.config.roleId && this.config.secretId) {
        await this.authenticateWithAppRole();
      } else {
        throw new Error('No authentication method configured');
      }

      // Set token in client headers
      this.client.defaults.headers.common['X-Vault-Token'] = this.token;

      // Test connection
      await this.client.get('/v1/sys/health');
      this.connected = true;
    } catch (error) {
      this.connected = false;
      throw new Error(`Failed to connect to Vault: ${error.message}`);
    }
  }

  private async authenticateWithAppRole(): Promise<void> {
    try {
      const response = await this.client.post('/v1/auth/approle/login', {
        role_id: this.config.roleId,
        secret_id: this.config.secretId,
      });

      this.token = response.data.auth.client_token;
    } catch (error) {
      throw new Error(`AppRole authentication failed: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.token && this.connected) {
      try {
        await this.client.post('/v1/auth/token/revoke-self');
      } catch (error) {
        // Log error but don't throw - disconnection should always succeed
        console.warn('Failed to revoke Vault token:', error.message);
      }
    }
    
    this.token = undefined;
    this.connected = false;
    delete this.client.defaults.headers.common['X-Vault-Token'];
  }

  isConnected(): boolean {
    return this.connected;
  }

  async writeSecret(path: string, data: Record<string, any>, metadata?: Record<string, any>): Promise<void> {
    this.ensureConnected();
    
    const fullPath = `${this.config.mountPath}/data/${path}`;
    const payload = {
      data,
      ...(metadata && { metadata }),
    };

    try {
      await this.retryOperation(async () => {
        await this.client.post(`/v1/${fullPath}`, payload);
      });
    } catch (error) {
      throw new Error(`Failed to write secret at ${path}: ${error.message}`);
    }
  }

  async readSecret(path: string, version?: number): Promise<{ data: Record<string, any>; metadata: Record<string, any> } | null> {
    this.ensureConnected();
    
    const fullPath = `${this.config.mountPath}/data/${path}`;
    const params = version ? { version: version.toString() } : {};

    try {
      const response = await this.retryOperation(async () => {
        return await this.client.get(`/v1/${fullPath}`, { params });
      });

      if (!response.data?.data) {
        return null;
      }

      return {
        data: response.data.data.data,
        metadata: response.data.data.metadata,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to read secret at ${path}: ${error.message}`);
    }
  }

  async deleteSecret(path: string): Promise<void> {
    this.ensureConnected();
    
    const fullPath = `${this.config.mountPath}/data/${path}`;

    try {
      await this.retryOperation(async () => {
        await this.client.delete(`/v1/${fullPath}`);
      });
    } catch (error) {
      throw new Error(`Failed to delete secret at ${path}: ${error.message}`);
    }
  }

  async listSecrets(path: string): Promise<string[]> {
    this.ensureConnected();
    
    const fullPath = `${this.config.mountPath}/metadata/${path}`;

    try {
      const response = await this.retryOperation(async () => {
        return await this.client.get(`/v1/${fullPath}`, {
          params: { list: 'true' },
        });
      });

      return response.data?.data?.keys || [];
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      throw new Error(`Failed to list secrets at ${path}: ${error.message}`);
    }
  }

  async getSecretVersions(path: string): Promise<Array<{ version: number; createdAt: Date; deletedAt?: Date }>> {
    this.ensureConnected();
    
    const fullPath = `${this.config.mountPath}/metadata/${path}`;

    try {
      const response = await this.retryOperation(async () => {
        return await this.client.get(`/v1/${fullPath}`);
      });

      const versions = response.data?.data?.versions || {};
      return Object.entries(versions).map(([version, info]: [string, any]) => ({
        version: parseInt(version, 10),
        createdAt: new Date(info.created_time),
        ...(info.deletion_time && { deletedAt: new Date(info.deletion_time) }),
      }));
    } catch (error) {
      throw new Error(`Failed to get secret versions for ${path}: ${error.message}`);
    }
  }

  async destroySecretVersion(path: string, version: number): Promise<void> {
    this.ensureConnected();
    
    const fullPath = `${this.config.mountPath}/destroy/${path}`;

    try {
      await this.retryOperation(async () => {
        await this.client.post(`/v1/${fullPath}`, {
          versions: [version],
        });
      });
    } catch (error) {
      throw new Error(`Failed to destroy secret version ${version} at ${path}: ${error.message}`);
    }
  }

  async getSecretMetadata(path: string): Promise<Record<string, any> | null> {
    this.ensureConnected();
    
    const fullPath = `${this.config.mountPath}/metadata/${path}`;

    try {
      const response = await this.retryOperation(async () => {
        return await this.client.get(`/v1/${fullPath}`);
      });

      return response.data?.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to get secret metadata for ${path}: ${error.message}`);
    }
  }

  async updateSecretMetadata(path: string, metadata: Record<string, any>): Promise<void> {
    this.ensureConnected();
    
    const fullPath = `${this.config.mountPath}/metadata/${path}`;

    try {
      await this.retryOperation(async () => {
        await this.client.post(`/v1/${fullPath}`, metadata);
      });
    } catch (error) {
      throw new Error(`Failed to update secret metadata for ${path}: ${error.message}`);
    }
  }

  async createPolicy(name: string, policy: string): Promise<void> {
    this.ensureConnected();

    try {
      await this.retryOperation(async () => {
        await this.client.put(`/v1/sys/policies/acl/${name}`, {
          policy,
        });
      });
    } catch (error) {
      throw new Error(`Failed to create policy ${name}: ${error.message}`);
    }
  }

  async updatePolicy(name: string, policy: string): Promise<void> {
    await this.createPolicy(name, policy); // PUT operation handles both create and update
  }

  async deletePolicy(name: string): Promise<void> {
    this.ensureConnected();

    try {
      await this.retryOperation(async () => {
        await this.client.delete(`/v1/sys/policies/acl/${name}`);
      });
    } catch (error) {
      throw new Error(`Failed to delete policy ${name}: ${error.message}`);
    }
  }

  async getPolicy(name: string): Promise<string | null> {
    this.ensureConnected();

    try {
      const response = await this.retryOperation(async () => {
        return await this.client.get(`/v1/sys/policies/acl/${name}`);
      });

      return response.data?.data?.policy || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to get policy ${name}: ${error.message}`);
    }
  }

  async createToken(policies: string[], ttl?: string): Promise<{ token: string; accessor: string }> {
    this.ensureConnected();

    const payload: any = { policies };
    if (ttl) {
      payload.ttl = ttl;
    }

    try {
      const response = await this.retryOperation(async () => {
        return await this.client.post('/v1/auth/token/create', payload);
      });

      return {
        token: response.data.auth.client_token,
        accessor: response.data.auth.accessor,
      };
    } catch (error) {
      throw new Error(`Failed to create token: ${error.message}`);
    }
  }

  async revokeToken(token: string): Promise<void> {
    this.ensureConnected();

    try {
      await this.retryOperation(async () => {
        await this.client.post('/v1/auth/token/revoke', { token });
      });
    } catch (error) {
      throw new Error(`Failed to revoke token: ${error.message}`);
    }
  }

  async renewToken(token: string, increment?: string): Promise<void> {
    this.ensureConnected();

    const payload: any = { token };
    if (increment) {
      payload.increment = increment;
    }

    try {
      await this.retryOperation(async () => {
        await this.client.post('/v1/auth/token/renew', payload);
      });
    } catch (error) {
      throw new Error(`Failed to renew token: ${error.message}`);
    }
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Not connected to Vault. Call connect() first.');
    }
  }

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    const maxRetries = this.config.retryConfig?.maxRetries || 3;
    const retryDelay = this.config.retryConfig?.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        // Only retry on certain error conditions
        if (this.shouldRetry(error)) {
          await this.delay(retryDelay * attempt);
          continue;
        }

        throw error;
      }
    }

    throw new Error('Retry operation failed unexpectedly');
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      (error.response && error.response.status >= 500)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}