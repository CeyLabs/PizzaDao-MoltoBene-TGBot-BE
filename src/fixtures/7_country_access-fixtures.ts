import { Knex } from 'knex';

const tableName = 'country_access';

export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex(tableName).count();
  if (Number(count) > 0) return;

  interface ICountry {
    id: number;
    name: string;
  }
  const country: ICountry | undefined = await knex<ICountry>('country')
    .where({ name: 'Sri Lanka' })
    .first();

  await knex(tableName).insert({
    user_telegram_id: '1241473040',
    country_id: country!.id,
  });
}
