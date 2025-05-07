import { Knex } from 'knex';

const tableName = "admin";

export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex(tableName).count();
  if (Number(count) > 0) return;

  await knex(tableName).insert([
    {
      telegram_id: '555555555',
      role: 'admin',
      cities: ['Rome', 'Milan', 'Florence', 'Venice'],
    },
  ]);
}
