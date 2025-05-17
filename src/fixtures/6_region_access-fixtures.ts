import { Knex } from 'knex';

const tableName = 'region_access';

export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex(tableName).count();
  if (Number(count) > 0) return;

  interface IRegion {
    id: string;
    name: string;
  }
  const country: IRegion | undefined = await knex<IRegion>('region')
    .where({ name: '🌏 Asia' })
    .first();

  await knex(tableName).insert({
    user_telegram_id: '1180327057',
    region_id: country!.id,
  });
}
