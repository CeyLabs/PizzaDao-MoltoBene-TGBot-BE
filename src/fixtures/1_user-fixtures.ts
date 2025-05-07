import { Knex } from 'knex';

const tableName = 'user';

export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex(tableName).count();
  if (Number(count) > 0) return;

  await knex(tableName).insert([
    {
      telegram_id: '555555555',
      username: 'italy_admin',
      tg_first_name: 'Italy',
      tg_last_name: 'Admin',
      custom_full_name: 'Italy Admin',
      country: 'Italy',
      city: 'Rome',
      role: 'admin',
      mafia_movie: 'The Godfather',
      ninja_turtle_character: 'Leonardo',
      pizza_topping: 'Pepperoni',
    },
    {
      telegram_id: '123456789',
      username: 'john_doe',
      tg_first_name: 'John',
      tg_last_name: 'Doe',
      custom_full_name: 'John Doe',
      country: 'USA',
      city: 'New York',
      role: 'user',
      mafia_movie: 'Goodfellas',
      ninja_turtle_character: 'Michelangelo',
      pizza_topping: 'Mushrooms',
    },
  ]);
}
