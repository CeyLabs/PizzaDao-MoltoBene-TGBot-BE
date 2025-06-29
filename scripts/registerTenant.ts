import { knex as createKnex } from 'knex';
import knexConfig from '../knexfile';
import { ITenant } from '../src/modules/tenant/tenant.interface';

async function main() {
  const args = process.argv.slice(2);
  const [name, token, username] = args;
  if (!name || !token) {
    console.error('Usage: ts-node registerTenant.ts <name> <bot_token> [bot_username]');
    process.exit(1);
  }

  const env = process.env.NODE_ENV || 'development';
  const knex = createKnex((knexConfig as Record<string, any>)[env]);

  try {
    const [tenant] = await knex<ITenant>('tenant')
      .insert({ name, bot_token: token, bot_username: username, is_active: true })
      .returning('*');
    console.log('Tenant registered:', tenant);
  } catch (err) {
    console.error('Failed to register tenant:', err);
  } finally {
    await knex.destroy();
  }
}

main();
