import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getBotToken } from 'nestjs-telegraf';
import { session, Telegraf } from 'telegraf';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);

    // Get the bot instance
    const bot = app.get<Telegraf>(getBotToken());

    // Use session middleware
    bot.use(session());

    // Log middleware for debugging
    bot.use((ctx, next) => {
      logger.debug(`Processing update ${ctx.updateType}`);
      return next();
    });

    await app.listen(process.env.PORT || 3000);

    logger.log(`Application is running on port: ${process.env.PORT || 3000}`);
  } catch (error) {
    logger.error('Failed to start application:', error);
  }
}
bootstrap();
