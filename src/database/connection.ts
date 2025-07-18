import knex from 'knex';
import { config } from '../config';
import { logger } from '../utils/logger';

const knexConfig = {
  client: 'postgresql',
  connection: {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: config.database.pool.min,
    max: config.database.pool.max,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
  migrations: {
    directory: './src/database/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './src/database/seeds',
  },
};

export const db = knex(knexConfig);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeConnection = async (): Promise<void> => {
  try {
    await db.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

export default db;