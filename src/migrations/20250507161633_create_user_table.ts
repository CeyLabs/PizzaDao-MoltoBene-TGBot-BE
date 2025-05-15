import type { Knex } from 'knex';

const tableName = 'user';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()')); // TODO: remove this, make telegram_id primary key
    table.string('telegram_id').notNullable().unique();
    table.string('username');
    table.string('tg_first_name').notNullable();
    table.string('tg_last_name');
    table.string('pizza_name').unique();
    table.string('discord_name');
    table.string('mafia_movie');
    table.specificType('ninja_turtle_character', 'text[]');
    table.string('pizza_topping');
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(tableName);
}
