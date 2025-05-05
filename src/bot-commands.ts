import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class BotCommandsService implements OnModuleInit {
  private readonly logger = new Logger(BotCommandsService.name);

  constructor(@InjectBot() private bot: Telegraf) {}

  async onModuleInit() {
    try {
      await this.bot.telegram.setMyCommands([
        { command: 'start', description: 'Start the bot' },
        { command: 'broadcast', description: 'Start a new broadcast' },
        { command: 'cancel', description: 'Cancel current broadcast' },
        { command: 'help', description: 'Show help information' },
      ]);
      this.logger.log('Bot commands have been set successfully');
    } catch (error) {
      this.logger.error('Error setting bot commands:', error);
    }
  }
}

export const helpMessage = `
📚 *Bot Usage Guide* 📚

This bot helps you broadcast messages to your Telegram communities.

*Commands:*
• /start - Start the bot
• /broadcast - Begin a new broadcast
• /cancel - Cancel current broadcast
• /help - Show this help message

*Broadcasting Steps:*
1️⃣ Select your target audience
2️⃣ Provide your message content
3️⃣ Add optional details like venue, date, etc.
4️⃣ Choose to add images or buttons
5️⃣ Review and send your broadcast

*Tips:*
• Use the 'Skip' button to bypass optional fields
• Super admins can broadcast to all groups
• Regular admins can broadcast to their city groups
• You can cancel anytime with /cancel

Need more help? Feel free to ask!
`;

export const welcomeMessage = `I'm your Broadcasting Assistant, here to help you share messages with your Telegram communities!

*What can I do?*
📢 Send announcements to multiple groups
🏙️ Target messages to specific cities
🖼️ Include images and buttons in your broadcasts
📌 Pin important messages

Ready to get started?`;
