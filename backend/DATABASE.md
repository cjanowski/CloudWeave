# CloudWeave Database Setup

This document describes the database infrastructure and setup for the CloudWeave cloud platform management system.

## Overview

The application uses PostgreSQL as the primary database with a comprehensive migration system for schema management. The database includes tables for users, organizations, infrastructure resources, deployments, metrics, audit logs, and alerts.

## Database Schema

### Core Tables

1. **organizations** - Organization/tenant data
2. **users** - User accounts and authentication
3. **infrastructure** - Cloud infrastructure resources
4. **deployments** - Application deployments
5. **metrics** - Performance and monitoring metrics
6. **audit_logs** - Audit trail for all user actions
7. **alerts** - System alerts and notifications

### Key Features

- UUID primary keys for all tables
- JSONB columns for flexible metadata storage
- Comprehensive indexing for performance
- Automatic `updated_at` timestamp triggers
- Foreign key constraints for data integrity
- Support for soft deletes where appropriate

## Setup Instructions

### Prerequisites

1. **PostgreSQL 12+** installed and running
2. **Go 1.21+** for running migrations
3. **Environment variables** configured

### Quick Setup

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Run the setup script**:
   ```bash
   chmod +x scripts/setup-db.sh
   ./scripts/setup-db.sh
   ```

3. **Configure environment variables** in `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=cloud_platform_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_SSL_MODE=disable
   ```

4. **Run migrations**:
   ```bash
   go run cmd/main.go
   # OR
   go run cmd/migrate/main.go -action=up
   ```

### Manual Setup

If you prefer manual setup:

1. **Create database**:
   ```sql
   CREATE DATABASE cloud_platform_db;
   ```

2. **Run migrations**:
   ```bash
   go run cmd/migrate/main.go -action=up
   ```

## Migration Management

### Available Commands

```bash
# Run all pending migrations
go run cmd/migrate/main.go -action=up

# Rollback last migration
go run cmd/migrate/main.go -action=down

# Rollback multiple migrations
go run cmd/migrate/main.go -action=down -steps=3

# Check current migration version
go run cmd/migrate/main.go -action=version
```

### Migration Files

Migration files are located in `migrations/` directory:
- `000001_initial_schema.up.sql` - Creates all tables and indexes
- `000001_initial_schema.down.sql` - Drops all tables and indexes

### Creating New Migrations

1. Create new migration files with incremented version numbers:
   ```
   migrations/000002_add_new_feature.up.sql
   migrations/000002_add_new_feature.down.sql
   ```

2. Follow naming convention: `{version}_{description}.{direction}.sql`

## Database Configuration

### Connection Settings

The application supports the following database configuration options:

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `5432` | Database port |
| `DB_NAME` | `cloud_platform_db` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `` | Database password |
| `DB_SSL_MODE` | `disable` | SSL mode (disable, require, verify-ca, verify-full) |

### Connection Pool Settings

The application configures connection pooling with:
- **Max Open Connections**: 25
- **Max Idle Connections**: 5
- **Connection Max Lifetime**: 5 minutes

## Health Checks

The application includes database health checks accessible via:

```bash
curl http://localhost:3001/api/v1/health
```

Response includes:
- Database connectivity status
- Current migration version
- Migration state (clean/dirty)

## Development Tips

### Local Development

1. **Use Docker for PostgreSQL** (optional):
   ```bash
   docker run --name cloudweave-postgres \
     -e POSTGRES_DB=cloud_platform_db \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 \
     -d postgres:15
   ```

2. **Database GUI Tools**:
   - pgAdmin
   - DBeaver
   - TablePlus
   - DataGrip

### Testing

For testing, consider using a separate test database:

```env
# .env.test
DB_NAME=cloud_platform_db_test
```

### Backup and Restore

```bash
# Backup
pg_dump -h localhost -U postgres cloud_platform_db > backup.sql

# Restore
psql -h localhost -U postgres cloud_platform_db < backup.sql
```

## Troubleshooting

### Common Issues

1. **Connection refused**:
   - Ensure PostgreSQL is running
   - Check host and port configuration
   - Verify firewall settings

2. **Authentication failed**:
   - Check username and password
   - Verify pg_hba.conf settings
   - Ensure user has database access

3. **Migration errors**:
   - Check migration file syntax
   - Verify database permissions
   - Review migration logs

4. **Performance issues**:
   - Check query execution plans
   - Verify indexes are being used
   - Monitor connection pool usage

### Logs

Application logs include database operation details. Check logs for:
- Connection errors
- Migration status
- Query performance warnings
- Health check results

## Security Considerations

1. **Use strong passwords** for database users
2. **Enable SSL** in production environments
3. **Restrict database access** to application servers only
4. **Regular backups** and disaster recovery planning
5. **Monitor audit logs** for suspicious activity
6. **Keep PostgreSQL updated** with security patches

## Production Deployment

For production environments:

1. **Use managed database services** (AWS RDS, Google Cloud SQL, etc.)
2. **Enable SSL/TLS** encryption
3. **Set up read replicas** for scaling
4. **Configure automated backups**
5. **Monitor database performance**
6. **Set up alerting** for database issues

Example production configuration:
```env
DB_HOST=your-db-host.amazonaws.com
DB_PORT=5432
DB_NAME=cloud_platform_db
DB_USER=cloudweave_app
DB_PASSWORD=secure_random_password
DB_SSL_MODE=require
```