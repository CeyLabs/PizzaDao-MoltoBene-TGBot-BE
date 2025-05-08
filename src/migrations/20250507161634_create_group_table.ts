import type { Knex } from 'knex';

const tableName = 'group';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.string('chat_id').notNullable();
    table.uuid('city_id').nullable().references('id').inTable('city').onDelete('SET NULL');
    table
      .enu('type', ['group', 'supergroup', 'subgroup', 'channel'])
      .defaultTo('group')
      .notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(tableName);
}
