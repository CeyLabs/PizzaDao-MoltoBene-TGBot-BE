import type { Knex } from 'knex';

const tableName = 'user';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('telegram_id').notNullable().unique();
    table.string('username');
    table.string('tg_first_name').notNullable();
    table.string('tg_last_name');
    table.string('custom_full_name');
    table.string('country_id');
    table.string('city_id');
    table.string('role').defaultTo('user');
    table.string('mafia_movie');
    table.string('ninja_turtle_character');
    table.string('pizza_topping');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(tableName);
}
