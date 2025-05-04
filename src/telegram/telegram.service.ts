// telegram.service.ts
import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';

@Injectable()
export class TelegramService {
  constructor(@InjectBot() private bot: Telegraf<Context>) {}

  async getUserRole(chatId: number, userId: number): Promise<string> {
    try {
      const member = await this.bot.telegram.getChatMember(chatId, userId);
      return member.status;
    } catch (error) {
      return 'none';
    }
  }
}
