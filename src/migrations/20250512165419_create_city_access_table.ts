import type { Knex } from 'knex';

const tableName = 'city_access';

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
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('user_telegram_id', 'idx_city_access_user_telegram_id');
    table.index('city_id', 'idx_city_access_city_id');
    table.index(['user_telegram_id', 'city_id'], 'idx_city_access_user_city');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}
