import { BaseRepository } from '../../../repositories/base';
import {
  ISecretsRepository,
  Secret,
  SecretVersion,
  SecretFilter,
  SecretAuditLog,
} from './types';

export class SecretsRepository extends BaseRepository implements ISecretsRepository {
  async create(secret: Omit<Secret, 'id' | 'createdAt' | 'updatedAt'>): Promise<Secret> {
    const query = `
      INSERT INTO secrets (
        id, name, path, type, description, environment_id, version,
        rotation_config, access_policies, tags, metadata, created_by,
        last_accessed_at, last_rotated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *
    `;

    const values = [
      secret.name,
      secret.path,
      secret.type,
      secret.description,
      secret.environmentId,
      secret.version,
      JSON.stringify(secret.rotationConfig),
      JSON.stringify(secret.accessPolicies),
      JSON.stringify(secret.tags),
      JSON.stringify(secret.metadata),
      secret.createdBy,
      secret.lastAccessedAt,
      secret.lastRotatedAt,
    ];

    const result = await this.db.query(query, values);
    return this.mapRowToSecret(result.rows[0]);
  }

  async findById(id: string): Promise<Secret | null> {
    const query = 'SELECT * FROM secrets WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSecret(result.rows[0]);
  }

  async findByPath(path: string): Promise<Secret | null> {
    const query = 'SELECT * FROM secrets WHERE path = $1 AND deleted_at IS NULL';
    const result = await this.db.query(query, [path]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSecret(result.rows[0]);
  }

  async update(id: string, updates: Partial<Secret>): Promise<Secret> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic SET clause
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const columnName = this.camelToSnake(key);
        if (typeof value === 'object' && value !== null) {
          setClause.push(`${columnName} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          setClause.push(`${columnName} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE secrets 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error(`Secret with ID ${id} not found`);
    }

    return this.mapRowToSecret(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    const query = `
      UPDATE secrets 
      SET deleted_at = NOW() 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    
    const result = await this.db.query(query, [id]);
    
    if (result.rowCount === 0) {
      throw new Error(`Secret with ID ${id} not found`);
    }
  }

  async findMany(filter?: SecretFilter): Promise<Secret[]> {
    let query = 'SELECT * FROM secrets WHERE deleted_at IS NULL';
    const values: any[] = [];
    let paramIndex = 1;

    if (filter) {
      const conditions = [];

      if (filter.environmentId) {
        conditions.push(`environment_id = $${paramIndex}`);
        values.push(filter.environmentId);
        paramIndex++;
      }

      if (filter.name) {
        conditions.push(`name ILIKE $${paramIndex}`);
        values.push(`%${filter.name}%`);
        paramIndex++;
      }

      if (filter.path) {
        conditions.push(`path ILIKE $${paramIndex}`);
        values.push(`%${filter.path}%`);
        paramIndex++;
      }

      if (filter.type) {
        conditions.push(`type = $${paramIndex}`);
        values.push(filter.type);
        paramIndex++;
      }

      if (filter.createdBy) {
        conditions.push(`created_by = $${paramIndex}`);
        values.push(filter.createdBy);
        paramIndex++;
      }

      if (filter.lastAccessedAfter) {
        conditions.push(`last_accessed_at > $${paramIndex}`);
        values.push(filter.lastAccessedAfter);
        paramIndex++;
      }

      if (filter.lastAccessedBefore) {
        conditions.push(`last_accessed_at < $${paramIndex}`);
        values.push(filter.lastAccessedBefore);
        paramIndex++;
      }

      if (filter.expiringBefore) {
        conditions.push(`
          rotation_config->>'enabled' = 'true' AND 
          (last_rotated_at + INTERVAL '1 day' * (rotation_config->>'interval')::int) < $${paramIndex}
        `);
        values.push(filter.expiringBefore);
        paramIndex++;
      }

      if (filter.tags && Object.keys(filter.tags).length > 0) {
        for (const [key, value] of Object.entries(filter.tags)) {
          conditions.push(`tags->>'${key}' = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (conditions.length > 0) {
        query += ` AND ${conditions.join(' AND ')}`;
      }
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.db.query(query, values);
    return result.rows.map(row => this.mapRowToSecret(row));
  }

  async search(searchQuery: string, filter?: SecretFilter): Promise<Secret[]> {
    let query = `
      SELECT * FROM secrets 
      WHERE deleted_at IS NULL 
      AND (
        name ILIKE $1 OR 
        description ILIKE $1 OR 
        path ILIKE $1
      )
    `;
    
    const values: any[] = [`%${searchQuery}%`];
    let paramIndex = 2;

    // Apply additional filters
    if (filter) {
      const conditions = [];

      if (filter.environmentId) {
        conditions.push(`environment_id = $${paramIndex}`);
        values.push(filter.environmentId);
        paramIndex++;
      }

      if (filter.type) {
        conditions.push(`type = $${paramIndex}`);
        values.push(filter.type);
        paramIndex++;
      }

      if (conditions.length > 0) {
        query += ` AND ${conditions.join(' AND ')}`;
      }
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.db.query(query, values);
    return result.rows.map(row => this.mapRowToSecret(row));
  }

  async createVersion(version: Omit<SecretVersion, 'id' | 'createdAt'>): Promise<SecretVersion> {
    const query = `
      INSERT INTO secret_versions (
        id, secret_id, version, value_hash, metadata, created_by, expires_at, is_active
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7
      ) RETURNING *
    `;

    const values = [
      version.secretId,
      version.version,
      version.valueHash,
      JSON.stringify(version.metadata),
      version.createdBy,
      version.expiresAt,
      version.isActive,
    ];

    const result = await this.db.query(query, values);
    return this.mapRowToSecretVersion(result.rows[0]);
  }

  async findVersions(secretId: string): Promise<SecretVersion[]> {
    const query = `
      SELECT * FROM secret_versions 
      WHERE secret_id = $1 
      ORDER BY version DESC
    `;
    
    const result = await this.db.query(query, [secretId]);
    return result.rows.map(row => this.mapRowToSecretVersion(row));
  }

  async findVersion(secretId: string, version: number): Promise<SecretVersion | null> {
    const query = `
      SELECT * FROM secret_versions 
      WHERE secret_id = $1 AND version = $2
    `;
    
    const result = await this.db.query(query, [secretId, version]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSecretVersion(result.rows[0]);
  }

  async createAuditLog(log: Omit<SecretAuditLog, 'id' | 'timestamp'>): Promise<SecretAuditLog> {
    const query = `
      INSERT INTO secret_audit_logs (
        id, secret_id, action, principal_id, principal_type, success,
        error_message, ip_address, user_agent, metadata
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *
    `;

    const values = [
      log.secretId,
      log.action,
      log.principalId,
      log.principalType,
      log.success,
      log.errorMessage,
      log.ipAddress,
      log.userAgent,
      log.metadata ? JSON.stringify(log.metadata) : null,
    ];

    const result = await this.db.query(query, values);
    return this.mapRowToAuditLog(result.rows[0]);
  }

  async findAuditLogs(secretId: string, limit?: number): Promise<SecretAuditLog[]> {
    let query = `
      SELECT * FROM secret_audit_logs 
      WHERE secret_id = $1 
      ORDER BY timestamp DESC
    `;
    
    const values = [secretId];

    if (limit) {
      query += ` LIMIT $2`;
      values.push(limit);
    }

    const result = await this.db.query(query, values);
    return result.rows.map(row => this.mapRowToAuditLog(row));
  }

  private mapRowToSecret(row: any): Secret {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      type: row.type,
      description: row.description,
      environmentId: row.environment_id,
      version: row.version,
      rotationConfig: row.rotation_config ? JSON.parse(row.rotation_config) : undefined,
      accessPolicies: row.access_policies ? JSON.parse(row.access_policies) : [],
      tags: row.tags ? JSON.parse(row.tags) : {},
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      lastAccessedAt: row.last_accessed_at,
      lastRotatedAt: row.last_rotated_at,
    };
  }

  private mapRowToSecretVersion(row: any): SecretVersion {
    return {
      id: row.id,
      secretId: row.secret_id,
      version: row.version,
      valueHash: row.value_hash,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdAt: row.created_at,
      createdBy: row.created_by,
      expiresAt: row.expires_at,
      isActive: row.is_active,
    };
  }

  private mapRowToAuditLog(row: any): SecretAuditLog {
    return {
      id: row.id,
      secretId: row.secret_id,
      action: row.action,
      principalId: row.principal_id,
      principalType: row.principal_type,
      success: row.success,
      errorMessage: row.error_message,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      timestamp: row.timestamp,
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}