import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user', (table) => {
    table.increments('id').primary();
    table.string('telegram_id').notNullable().unique();
    table.string('username');
    table.string('tg_first_name').notNullable();
    table.string('tg_last_name');
    table.string('custom_full_name');
    table.string('country');
    table.string('city');
    table.string('role').defaultTo('user');
    table.string('mafia_movie');
    table.string('ninja_turtle_character');
    table.string('pizza_topping');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user');
}
