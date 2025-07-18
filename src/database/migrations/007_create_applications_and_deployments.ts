import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create applications table
  await knex.schema.createTable('applications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description').nullable();
    table.uuid('project_id').notNullable();
    table.string('repository_url').nullable();
    table.jsonb('configuration').defaultTo('{}');
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    
    // Unique constraint for application name within project
    table.unique(['name', 'project_id']);
    
    // Indexes
    table.index(['project_id']);
    table.index(['name']);
  });

  // Create deployments table
  await knex.schema.createTable('deployments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('application_id').notNullable();
    table.uuid('environment_id').notNullable();
    table.string('version').notNullable();
    table.enum('status', ['pending', 'running', 'success', 'failed', 'rolled_back']).defaultTo('pending');
    table.enum('strategy', ['blue_green', 'canary', 'rolling']).defaultTo('rolling');
    table.jsonb('configuration').defaultTo('{}');
    table.uuid('deployed_by').notNullable();
    table.timestamp('started_at').nullable();
    table.timestamp('completed_at').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('application_id').references('id').inTable('applications').onDelete('CASCADE');
    table.foreign('environment_id').references('id').inTable('environments').onDelete('CASCADE');
    table.foreign('deployed_by').references('id').inTable('users').onDelete('RESTRICT');
    
    // Indexes
    table.index(['application_id']);
    table.index(['environment_id']);
    table.index(['status']);
    table.index(['deployed_by']);
    table.index(['started_at']);
  });

  // Create deployment_logs table
  return knex.schema.createTable('deployment_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('deployment_id').notNullable();
    table.enum('level', ['debug', 'info', 'warn', 'error']).defaultTo('info');
    table.text('message').notNullable();
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('deployment_id').references('id').inTable('deployments').onDelete('CASCADE');
    
    // Indexes
    table.index(['deployment_id']);
    table.index(['level']);
    table.index(['timestamp']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('deployment_logs');
  await knex.schema.dropTable('deployments');
  await knex.schema.dropTable('applications');
}