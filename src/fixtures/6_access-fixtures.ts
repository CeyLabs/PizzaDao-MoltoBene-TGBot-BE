import { Knex } from 'knex';

const tableName = 'access';

export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex(tableName).count();
  if (Number(count) > 0) return;

  interface User {
    telegram_id: string;
    username: string;
  }

  interface City {
    id: string;
    name: string;
  }

  // Fetch users
  const users: User[] = await knex<User>('user').whereIn('username', [
    'Nimsara',
    'helloscoopa',
    'kumuduwije',
  ]);

  // Fetch city
  const city: City | undefined = await knex<City>('city').where('name', 'Colombo').first();

  if (!city) {
    throw new Error('City data is missing. Please seed it first.');
  }

  // Map usernames to telegram IDs
  const userMap = Object.fromEntries(users.map((user) => [user.username, user.telegram_id]));

  await knex(tableName).insert([
    {
      user_telegram_id: userMap['Nimsara'],
      city_id: city.id,
      role: 'admin',
    },
    {
      user_telegram_id: userMap['helloscoopa'],
      city_id: city.id,
      role: 'host',
    },
    {
      user_telegram_id: userMap['kumuduwije'],
      city_id: city.id,
      role: 'underboss',
    },
  ]);
}
