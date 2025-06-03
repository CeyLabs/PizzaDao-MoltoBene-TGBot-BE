import { Knex } from 'knex';

const tableName = 'event_detail';

export async function seed(knex: Knex): Promise<void> {
  const [{ count }] = await knex(tableName).count();
  if (Number(count) > 0) return;

  await knex(tableName).insert({
    group_id: '-1002537156394', // PizzaDAO Group [Test] group_id
    is_one_person: true,
    name: 'Global Pizza Party Colombo 2025',
    slug: 'global-pizza-party-colombo-2025',
    image_url: 'https://example.com/image.jpg',
    start_time: '10:10',
    end_time: '11:11',
    timezone: 'Asia/Colombo',
    address: '123 Main St, Colombo',
    location: 'Colombo',
    year: 2025,
  });
}
