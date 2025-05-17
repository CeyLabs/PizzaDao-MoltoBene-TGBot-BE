import type { Knex } from 'knex';

const tableName = 'user';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.string('telegram_id').primary();
    table.string('username').unique();
    table.string('tg_first_name').notNullable();
    table.string('tg_last_name');
    table.string('pizza_name').unique();
    table.string('discord_name').unique();
    table.string('mafia_movie');
    table.specificType('ninja_turtle_character', 'text[]');
    table.string('pizza_topping');
    table.timestamps(true, true);

    table.index('username', 'idx_username');
    table.index('discord_name', 'idx_discord_name');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(tableName);
}
