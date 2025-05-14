import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { session, Telegraf } from 'telegraf';
import { getBotToken } from 'nestjs-telegraf';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get the bot instance
  const bot = app.get<Telegraf>(getBotToken());

  // Use session middleware
  bot.use(session());

  app.use(express.json());

  // Connect the webhook middleware
  if (process.env.ENABLE_WEBHOOK === 'true') {
    app.use(bot.webhookCallback('/webhook'));
  }

  // Start the NestJS application
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, () => {
    console.log(`Application is running on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
});
