import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('organizations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().unique();
    table.jsonb('settings').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['name']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('organizations');
}