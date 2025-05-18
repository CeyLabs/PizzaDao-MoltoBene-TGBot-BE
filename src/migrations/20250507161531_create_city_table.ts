import type { Knex } from 'knex';

const tableName = 'city';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.uuid('country_id').notNullable().references('id').inTable('country').onDelete('CASCADE');
    table.string('group_id').unique();
    table.string('telegram_link').unique();
    table.timestamps(true, true);

    table.index('country_id', 'idx_city_country_id');
    table.index('name', 'idx_city_name');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}
