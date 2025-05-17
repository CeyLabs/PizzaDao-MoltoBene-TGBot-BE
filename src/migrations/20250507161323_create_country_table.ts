import type { Knex } from 'knex';

const tableName = 'country';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.uuid('region_id').notNullable().references('id').inTable('region').onDelete('CASCADE');
    table.timestamps(true, true);

    table.index('region_id', 'idx_country_region_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}
