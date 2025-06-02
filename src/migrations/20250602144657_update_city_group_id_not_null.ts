import type { Knex } from 'knex';

const tableName = 'city';

export async function up(knex: Knex): Promise<void> {
  // First, ensure that all existing rows have a non-null value for group_id
  await knex(tableName).where({ group_id: null }).update({ group_id: 'DEFAULT_GROUP_ID' }); // Or handle differently based on your needs

  await knex.schema.alterTable(tableName, (table) => {
    table.string('group_id').notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.string('group_id').nullable().alter();
  });
}
