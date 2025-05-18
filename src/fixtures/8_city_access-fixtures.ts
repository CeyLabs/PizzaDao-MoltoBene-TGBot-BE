import { Knex } from 'knex';

const tableName = 'city_access';

export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex(tableName).count();
  if (Number(count) > 0) return;

  interface ICity {
    id: number;
    name: string;
  }
  const city: ICity | undefined = await knex<ICity>('city').where({ name: 'Colombo' }).first();

  await knex(tableName).insert({
    user_telegram_id: '1558627049',
    city_id: city!.id,
  });
}
