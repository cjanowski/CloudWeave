import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('configurations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('environment_id').notNullable();
    table.string('key').notNullable();
    table.text('value').notNullable();
    table.boolean('is_secret').defaultTo(false);
    table.integer('version').defaultTo(1);
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('environment_id').references('id').inTable('environments').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('RESTRICT');
    table.foreign('updated_by').references('id').inTable('users').onDelete('RESTRICT');
    
    // Unique constraint for key within environment
    table.unique(['environment_id', 'key']);
    
    // Indexes
    table.index(['environment_id']);
    table.index(['key']);
    table.index(['is_secret']);
    table.index(['version']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('configurations');
}