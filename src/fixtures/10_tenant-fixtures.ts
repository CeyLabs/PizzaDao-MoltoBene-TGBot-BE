import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('tenant').del();
  await knex('tenant').insert([
    {
      name: 'PizzaDAO',
      bot_token: 'YOUR_PIZZADAO_BOT_TOKEN',
      bot_username: 'pizza_bot',
      is_active: true,
    },
  ]);
}
