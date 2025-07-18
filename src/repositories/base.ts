import { Knex } from 'knex';
import { db } from '../database/connection';

export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected db: Knex;
  protected tableName: string;

  constructor(tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  async findById(id: string): Promise<T | null> {
    const result = await this.db(this.tableName)
      .where({ id })
      .first();
    
    return result || null;
  }

  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    const {
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'desc',
      filters = {}
    } = options;

    let query = this.db(this.tableName);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.whereIn(key, value);
        } else {
          query = query.where(key, value);
        }
      }
    });

    // Get total count
    const totalResult = await query.clone().count('* as count').first();
    const total = parseInt(totalResult?.count as string) || 0;

    // Apply pagination and ordering
    const data = await query
      .orderBy(orderBy, orderDirection)
      .limit(limit)
      .offset(offset);

    return {
      data,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const [result] = await this.db(this.tableName)
      .insert(data)
      .returning('*');
    
    return result;
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<T | null> {
    const [result] = await this.db(this.tableName)
      .where({ id })
      .update({
        ...data,
        updated_at: new Date()
      })
      .returning('*');
    
    return result || null;
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await this.db(this.tableName)
      .where({ id })
      .del();
    
    return deletedCount > 0;
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.db(this.tableName)
      .where({ id })
      .first('id');
    
    return !!result;
  }

  async count(filters: Record<string, any> = {}): Promise<number> {
    let query = this.db(this.tableName);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.where(key, value);
      }
    });

    const result = await query.count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  protected async transaction<R>(callback: (trx: Knex.Transaction) => Promise<R>): Promise<R> {
    return this.db.transaction(callback);
  }
}