import { Knex } from 'knex';

const tableName = 'user';

export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex(tableName).count();
  if (Number(count) > 0) return;

  // Fetch the country ID for "Sri Lanka"
  interface Country {
    id: number;
    name: string;
  }
  const country: Country | undefined = await knex<Country>('country')
    .where({ name: 'Sri Lanka' })
    .first();

  interface City {
    id: number;
    name: string;
  }
  if (!country) {
    throw new Error('Country data is missing. Please seed it first.');
  }

  // Fetch the city ID for "Colombo"
  const city: City | undefined = await knex<City>('city')
    .where('name', 'Colombo')
    .andWhere('country_id', country.id)
    .first();

  if (!country || !city) {
    throw new Error('Country or City data is missing. Please seed them first.');
  }

  await knex(tableName).insert([
    {
      telegram_id: '1180327057',
      username: 'Nimsara',
      tg_first_name: 'Nimsara',
      tg_last_name: '',
      pizza_name: 'Pineapple Damon ',
      discord_name: 'mrcentimetre',
      country_id: country.id,
      city_id: city.id,
      role: 'admin',
      mafia_movie: 'The Irish',
      ninja_turtle_character: ['Leonardo', 'Donatello'],
      pizza_topping: 'Pineapple',
    },
  ]);
}
