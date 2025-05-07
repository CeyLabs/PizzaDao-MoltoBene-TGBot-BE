import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('admin', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .string('telegram_id')
      .notNullable()
      .unique()
      .references('telegram_id')
      .inTable('user')
      .onDelete('CASCADE');
    table.string('role').notNullable();
    table.specificType('cities', 'text[]');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('admin');
}
