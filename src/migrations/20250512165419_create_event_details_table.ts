import type { Knex } from 'knex';

const tableName = 'event_details';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('group_id').notNullable().references('group_id').inTable('city').onDelete('CASCADE');
    table.boolean('is_one_person').notNullable().defaultTo(true),
    table.string('name')
    table.string('slug')
    table.string('image_url')
    table.string('start_date')
    table.string('start_time')
    table.string('end_date')
    table.string('end_time')
    table.string('timezone')
    table.string('address')
    table.string('location')
    table.integer('year')
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(tableName);
}
