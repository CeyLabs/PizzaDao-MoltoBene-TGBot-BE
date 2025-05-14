import { Knex } from 'knex';

const tableName = 'region';

export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex(tableName).count();
  if (Number(count) > 0) return;

  await knex(tableName).insert([
    { name: '🌍 Africa' },
    { name: '🌏 Asia' },
    { name: '🌎 Caribbean' },
    { name: '🌎 Central America' },
    { name: '🌎 Eastern Europe' },
    { name: '🌎 Middle East' },
    { name: '🌎 North America' },
    { name: '🌏 Oceania' },
    { name: '🌎 South America' },
    { name: '🌎 Western Europe' },
    { name: '🎮 Metaverse' },
  ]);
}
