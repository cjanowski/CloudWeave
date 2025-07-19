import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add missing columns to configurations table
  await knex.schema.alterTable('configurations', (table) => {
    table.string('name').notNullable().defaultTo('');
    table.string('type').notNullable().defaultTo('string');
    table.text('description').nullable();
    table.jsonb('tags').defaultTo('{}');
  });

  // Create configuration_templates table
  await knex.schema.createTable('configuration_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().unique();
    table.text('description');
    table.jsonb('schema').notNullable();
    table.jsonb('default_values').notNullable().defaultTo('{}');
    table.jsonb('tags').defaultTo('{}');
    table.string('created_by').notNullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index(['name']);
    table.index(['created_by']);
  });

  // Create configuration_versions table
  await knex.schema.createTable('configuration_versions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('configuration_id').notNullable();
    table.integer('version').notNullable();
    table.text('value').notNullable();
    table.text('change_description');
    table.string('created_by').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign key constraints
    table.foreign('configuration_id').references('id').inTable('configurations').onDelete('CASCADE');
    
    // Unique constraint on configuration_id + version
    table.unique(['configuration_id', 'version']);
    
    // Indexes
    table.index(['configuration_id']);
    table.index(['version']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('configuration_versions');
  await knex.schema.dropTableIfExists('configuration_templates');
  
  // Remove added columns from configurations table
  await knex.schema.alterTable('configurations', (table) => {
    table.dropColumn('name');
    table.dropColumn('type');
    table.dropColumn('description');
    table.dropColumn('tags');
  });
}