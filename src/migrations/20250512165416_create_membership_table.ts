import type { Knex } from 'knex';

const tableName = 'membership';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .string('user_telegram_id')
      .notNullable()
      .references('telegram_id')
      .inTable('user')
      .onDelete('CASCADE');
    table.uuid('city_id').notNullable().references('id').inTable('city').onDelete('CASCADE');
    table.timestamp('joined_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}
