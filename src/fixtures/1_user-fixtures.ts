import { Knex } from 'knex';

const tableName = 'user';

export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex(tableName).count();
  if (Number(count) > 0) return;

  await knex(tableName).insert([
    {
      telegram_id: '1180327057',
      username: 'Nimsara',
      tg_first_name: 'Nimsara',
      tg_last_name: '',
      custom_full_name: 'Udana Nimsara',
      country_id: '496519a3-6444-4d0b-91cf-c9eb20817f9f',
      city_id: 'de1f43db-6d72-48b6-b3e6-985f0531ecc9',
      role: 'admin',
      mafia_movie: 'The Godfather',
      ninja_turtle_character: 'Leonardo',
      pizza_topping: 'Pepperoni',
    },
  ]);
}
