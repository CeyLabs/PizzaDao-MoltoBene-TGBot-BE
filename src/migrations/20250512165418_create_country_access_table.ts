import type { Knex } from 'knex';

const tableName = 'country_access';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .string('user_telegram_id')
      .notNullable()
      .references('telegram_id')
      .inTable('user')
      .onDelete('CASCADE');
    table.uuid('country_id').notNullable().references('id').inTable('country').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('user_telegram_id', 'idx_country_access_user_telegram_id');
    table.index('country_id', 'idx_country_access_country_id');
    table.index(['user_telegram_id', 'country_id'], 'idx_country_access_user_country');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}
