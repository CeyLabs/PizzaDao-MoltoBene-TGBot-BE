import { Knex } from 'knex';

const tableName = 'region';

export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex(tableName).count();
  if (Number(count) > 0) return;

  await knex(tableName).insert([
    { name: 'North America' },
    { name: 'Africa' },
    { name: 'Asia' },
    { name: 'Eastern Europe' },
    { name: 'South America' },
    { name: 'Western Europe' },
    { name: 'Central America' },
    { name: 'Middle East' },
    { name: 'Oceania' },
    { name: 'Metaverse' },
    { name: 'Caribbean' },
  ]);
}
