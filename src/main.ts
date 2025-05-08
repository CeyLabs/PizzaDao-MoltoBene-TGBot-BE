import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Telegraf } from 'telegraf';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

  // Define your bot commands and handlers here
  bot.start((ctx) => ctx.reply('Welcome!'));
  bot.on('text', (ctx) => ctx.reply(`You said: ${ctx.message.text}`));

  // Set up webhook
  const webhookPath = '/webhook';
  server.use(bot.webhookCallback(webhookPath));

  // Set the webhook URL
  const webhookUrl = `${process.env.WEBHOOK_DOMAIN}${webhookPath}`;
  await bot.telegram.setWebhook(webhookUrl);

  server.post('/customer', (req, res) => {
    // Example logic: echo back JSON body
    console.log('Received customer data:', req.body);
    res.status(201).json({ message: 'Customer data received' });
  });

  // Start the NestJS application
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, () => {
    console.log(`Application is running on port ${PORT}`);
    console.log(`Webhook set to: ${webhookUrl}`);
  });
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
});
