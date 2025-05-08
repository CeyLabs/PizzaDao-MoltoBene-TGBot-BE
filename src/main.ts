import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Telegraf } from 'telegraf';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
  const server = express(); // Create an Express server
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  const bot = new Telegraf(process.env.BOT_TOKEN!);

  // Define your bot commands and handlers here
  bot.start((ctx) => ctx.reply('Welcome!'));
  bot.on('text', (ctx) => ctx.reply(`You said: ${ctx.message.text}`));

  // Set up webhook
  server.use(bot.webhookCallback('/webhook'));

  // Start the NestJS application
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, () => {
    console.log(`Application is running on port ${PORT}`);
  });
}
bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
});
