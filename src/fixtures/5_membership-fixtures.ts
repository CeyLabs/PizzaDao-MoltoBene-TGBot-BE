import { Knex } from 'knex';

const tableName = 'membership';

export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex(tableName).count();
  if (Number(count) > 0) return;

  interface User {
    id: string;
    telegram_id: string;
  }
  const user: User | undefined = await knex<User>('user')
    .where({ telegram_id: '1180327057' })
    .first();

  if (!user) {
    throw new Error('User data is missing. Please seed the user table first.');
  }

  interface City {
    id: string;
    name: string;
  }

  // Fetch the cities
  const cities: City[] = await knex<City>('city').whereIn('name', ['Colombo', 'Galle', 'Kandy']);

  if (cities.length !== 3) {
    throw new Error(
      'One or more cities (Colombo, Galle, Kandy) are missing. Please seed them first.',
    );
  }

  const cityUserRecords = cities.map((city) => ({
    user_telegram_id: user.telegram_id,
    city_id: city.id,
    joined_at: knex.fn.now(),
  }));

  await knex(tableName).insert(cityUserRecords);
}
