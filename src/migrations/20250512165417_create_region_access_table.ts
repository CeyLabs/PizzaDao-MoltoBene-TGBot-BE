import type { Knex } from 'knex';

const tableName = 'region_access';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .string('user_telegram_id')
      .notNullable()
      .references('telegram_id')
      .inTable('user')
      .onDelete('CASCADE');
    table.uuid('region_id').notNullable().references('id').inTable('region').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('user_telegram_id', 'idx_region_access_user_telegram_id');
    table.index('region_id', 'idx_region_access_region_id');
    table.index(['user_telegram_id', 'region_id'], 'idx_region_access_user_region');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}
