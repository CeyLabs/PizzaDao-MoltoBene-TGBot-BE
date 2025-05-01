// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getBotToken } from 'nestjs-telegraf';
import { sessionMiddleware } from './middleware/session.middleware';
import { config } from './config/config';
import { Telegraf } from 'telegraf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get the bot instance
  const bot = app.get<Telegraf>(getBotToken());

  // Use session middleware
  bot.use(sessionMiddleware());

  await app.listen(config.port);

  console.log(`Application is running on port: ${config.port}`);
}
bootstrap();
