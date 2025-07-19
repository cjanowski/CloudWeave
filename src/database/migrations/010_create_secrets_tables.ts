import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create secrets table
  await knex.schema.createTable('secrets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('path').notNullable().unique();
    table.string('type').notNullable();
    table.text('description');
    table.uuid('environment_id').notNullable();
    table.integer('version').notNullable().defaultTo(1);
    table.jsonb('rotation_config');
    table.jsonb('access_policies').defaultTo('[]');
    table.jsonb('tags').defaultTo('{}');
    table.jsonb('metadata').defaultTo('{}');
    table.string('created_by').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('last_accessed_at');
    table.timestamp('last_rotated_at');
    table.timestamp('deleted_at');

    // Indexes
    table.index(['environment_id']);
    table.index(['name']);
    table.index(['type']);
    table.index(['created_by']);
    table.index(['last_accessed_at']);
    table.index(['last_rotated_at']);
    table.index(['deleted_at']);

    // Foreign key constraint
    table.foreign('environment_id').references('id').inTable('environments');
  });

  // Create secret_versions table
  await knex.schema.createTable('secret_versions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('secret_id').notNullable();
    table.integer('version').notNullable();
    table.string('value_hash').notNullable(); // SHA-256 hash of the secret value
    table.jsonb('metadata').defaultTo('{}');
    table.string('created_by').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at');
    table.boolean('is_active').defaultTo(true);

    // Composite unique constraint
    table.unique(['secret_id', 'version']);

    // Indexes
    table.index(['secret_id']);
    table.index(['version']);
    table.index(['created_at']);
    table.index(['expires_at']);
    table.index(['is_active']);

    // Foreign key constraint
    table.foreign('secret_id').references('id').inTable('secrets').onDelete('CASCADE');
  });

  // Create secret_audit_logs table
  await knex.schema.createTable('secret_audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('secret_id').notNullable();
    table.string('action').notNullable(); // create, read, update, delete, rotate, etc.
    table.string('principal_id').notNullable(); // user, service, or system identifier
    table.string('principal_type').notNullable(); // user, service, system
    table.boolean('success').notNullable();
    table.text('error_message');
    table.string('ip_address');
    table.text('user_agent');
    table.jsonb('metadata');
    table.timestamp('timestamp').defaultTo(knex.fn.now());

    // Indexes
    table.index(['secret_id']);
    table.index(['action']);
    table.index(['principal_id']);
    table.index(['principal_type']);
    table.index(['success']);
    table.index(['timestamp']);

    // Foreign key constraint
    table.foreign('secret_id').references('id').inTable('secrets').onDelete('CASCADE');
  });

  // Create secret_access_policies table
  await knex.schema.createTable('secret_access_policies', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.uuid('secret_id').notNullable();
    table.string('principal_id').notNullable();
    table.string('principal_type').notNullable(); // user, role, service
    table.jsonb('permissions').notNullable(); // array of permissions
    table.jsonb('conditions'); // access conditions (IP, time, etc.)
    table.timestamp('expires_at');
    table.string('created_by').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['secret_id']);
    table.index(['principal_id']);
    table.index(['principal_type']);
    table.index(['expires_at']);
    table.index(['created_at']);

    // Unique constraint for principal per secret
    table.unique(['secret_id', 'principal_id']);

    // Foreign key constraint
    table.foreign('secret_id').references('id').inTable('secrets').onDelete('CASCADE');
  });

  // Create secret_rotation_schedules table
  await knex.schema.createTable('secret_rotation_schedules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('secret_id').notNullable().unique();
    table.timestamp('next_rotation_at').notNullable();
    table.timestamp('last_rotation_at');
    table.integer('rotation_interval_days').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.jsonb('rotation_config');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['next_rotation_at']);
    table.index(['last_rotation_at']);
    table.index(['is_active']);

    // Foreign key constraint
    table.foreign('secret_id').references('id').inTable('secrets').onDelete('CASCADE');
  });

  // Add triggers for updated_at timestamps
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  await knex.raw(`
    CREATE TRIGGER update_secrets_updated_at 
    BEFORE UPDATE ON secrets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);

  await knex.raw(`
    CREATE TRIGGER update_secret_rotation_schedules_updated_at 
    BEFORE UPDATE ON secret_rotation_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS update_secrets_updated_at ON secrets');
  await knex.raw('DROP TRIGGER IF EXISTS update_secret_rotation_schedules_updated_at ON secret_rotation_schedules');
  await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column()');

  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('secret_rotation_schedules');
  await knex.schema.dropTableIfExists('secret_access_policies');
  await knex.schema.dropTableIfExists('secret_audit_logs');
  await knex.schema.dropTableIfExists('secret_versions');
  await knex.schema.dropTableIfExists('secrets');
}