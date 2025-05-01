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
