const path = require('path');

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'cloud_platform_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
    migrations: {
      directory: path.join(__dirname, 'src/database/migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.join(__dirname, 'src/database/seeds'),
    },
  },

  test: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'cloud_platform_test_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    },
    pool: {
      min: 1,
      max: 5,
    },
    migrations: {
      directory: path.join(__dirname, 'src/database/migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.join(__dirname, 'src/database/seeds'),
    },
  },

  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    },
    migrations: {
      directory: path.join(__dirname, 'src/database/migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.join(__dirname, 'src/database/seeds'),
    },
  },
};