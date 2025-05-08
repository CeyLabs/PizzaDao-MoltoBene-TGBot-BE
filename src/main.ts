import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Telegraf } from 'telegraf';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

  await bot.launch({
    webhook: {
      domain: process.env.WEBHOOK_DOMAIN as string,
      port: 443,
      path: '/webhook',
    },
  });

  server.post('/customer', (req, res) => {
    // Example logic: echo back JSON body
    console.log('Received customer data:', req.body);
    res.status(201).json({ message: 'Customer data received' });
  });

  // Start the NestJS application
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, () => {
    console.log(`Application is running on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
});
