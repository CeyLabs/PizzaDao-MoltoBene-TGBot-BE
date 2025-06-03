import type { Knex } from 'knex';

const tableName = 'city';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.string('group_id').notNullable().alter();
    table.string('telegram_link').notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.string('group_id').nullable().alter();
    table.string('telegram_link').nullable().alter();
  });
}
