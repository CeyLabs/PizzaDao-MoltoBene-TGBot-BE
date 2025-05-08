import { Telegraf } from 'telegraf';
import express from 'express';

const bot = new Telegraf(process.env.BOT_TOKEN!);

// Define your bot commands and handlers here
bot.start((ctx) => ctx.reply('Welcome!'));
bot.on('text', (ctx) => ctx.reply(`You said: ${ctx.message.text}`));

// Set up webhook
const app = express();
app.use(bot.webhookCallback('/webhook'));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot is running on port ${PORT}`);
});
