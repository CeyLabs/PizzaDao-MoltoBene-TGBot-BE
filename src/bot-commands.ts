import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class BotCommandsService implements OnModuleInit {
  constructor(@InjectBot() private bot: Telegraf) {}

  async onModuleInit() {
    try {
      await this.bot.telegram.setMyCommands([
        { command: 'start', description: 'Start the bot' },
        { command: 'help', description: 'Show help information' },
        { command: 'broadcast', description: 'Start a broadcast message' },
      ]);
      console.log('Bot commands have been set successfully');
    } catch (error) {
      console.error('Error setting bot commands:', error);
    }
  }
}
