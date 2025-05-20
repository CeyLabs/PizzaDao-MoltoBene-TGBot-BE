import { Injectable } from '@nestjs/common';
import { On, Update } from 'nestjs-telegraf';
import { WelcomeService } from '../welcome/welcome.service';
import { Context } from 'telegraf';
import { TelegramLoggerService } from 'src/utils/telegram-logger.service';

@Update()
@Injectable()
export class CommonService {
  constructor(
    private readonly welcomeService: WelcomeService,
    private readonly telegramLogger: TelegramLoggerService, // inject logger
  ) {}

  @On('text')
  async handlePrivateChat(ctx: Context) {
    try {
      await this.welcomeService.handlePrivateChat(ctx);
      await this.telegramLogger.logEvent(`[EVENT][text] <pre>${JSON.stringify(ctx.message)}</pre>`);
    } catch (error) {
      await this.telegramLogger.logError(
        `[ERROR][handlePrivateChat] ${error instanceof Error ? error.stack : error}`,
      );
      throw error;
    }
  }
}
