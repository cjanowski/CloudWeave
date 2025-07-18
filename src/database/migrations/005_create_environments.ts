import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('environments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.uuid('project_id').notNullable();
    table.enum('type', ['development', 'staging', 'production']).notNullable();
    table.enum('cloud_provider', ['aws', 'azure', 'gcp']).notNullable();
    table.string('region').notNullable();
    table.jsonb('configuration').defaultTo('{}');
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    
    // Unique constraint for environment name within project
    table.unique(['name', 'project_id']);
    
    // Indexes
    table.index(['project_id']);
    table.index(['type']);
    table.index(['cloud_provider']);
    table.index(['region']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('environments');
}