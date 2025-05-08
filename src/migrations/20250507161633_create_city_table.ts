import type { Knex } from 'knex';

const tableName = 'city';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table
      .uuid('country_id')
      .notNullable()
      .references('id')
      .inTable('country')
      .onDelete('CASCADE');
    table
      .specificType('admin_ids', 'uuid[]')
      .defaultTo(knex.raw('ARRAY[]::uuid[]'));
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}
