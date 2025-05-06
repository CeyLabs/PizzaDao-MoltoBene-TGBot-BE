import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('admins', (table) => {
    table.increments('id').primary();
    table
      .string('telegram_id')
      .notNullable()
      .unique()
      .references('telegram_id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('role').notNullable();
    table.specificType('cities', 'text[]');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('admins');
}
