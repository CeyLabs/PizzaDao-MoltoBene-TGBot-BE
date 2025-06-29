/**
 * @fileoverview Main application entry point for the PizzaDao MoltoBene Telegram Bot
 * @module main
 */

import { NestFactory } from '@nestjs/core';
import { getBotToken } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { json } from 'express';
import { knex as createKnex } from 'knex';
import knexConfig from '../knexfile';
import { ITenant } from './modules/tenant/tenant.interface';
import { createAppModule } from './app.module';

/**
 * Bootstraps the NestJS application and configures the Telegram bot
 * @async
 * @function bootstrap
 * @returns {Promise<void>}
 * @throws {Error} If there's an error during application bootstrap
 */
async function bootstrap() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const knex = createKnex((knexConfig as Record<string, any>)[NODE_ENV]);

  let tenants: ITenant[] = [];
  try {
    tenants = await knex<ITenant>('tenant').where({ is_active: true });
  } catch (error) {
    console.error('Failed to load tenants:', error);
  } finally {
    await knex.destroy();
  }

  if (tenants.length === 0) {
    const envToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!envToken) {
      throw new Error('No tenants found and TELEGRAM_BOT_TOKEN is not set');
    }
    tenants = [{ id: 'env', name: 'default', bot_token: envToken, is_active: true } as ITenant];
  }

  const AppModule = createAppModule(tenants);
  const app = await NestFactory.create(AppModule);

  const bots = tenants.map((t) => app.get<Telegraf>(getBotToken(t.name)));

  app.use(json());

  if (process.env.ENABLE_WEBHOOK === 'true') {
    bots.forEach((bot) => app.use(bot.webhookCallback('/webhook')));
  }

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, () => {
    console.log(`Application is running on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
});
