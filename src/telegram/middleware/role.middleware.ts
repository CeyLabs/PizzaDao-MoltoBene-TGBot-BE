import { Injectable } from '@nestjs/common';
import { Context, MiddlewareFn } from 'telegraf';
import { TelegramService } from '../telegram.service';

@Injectable()
export class RoleMiddleware {
  constructor(private telegramService: TelegramService) {}

  roleValidationMiddleware(mainGroupId: number): MiddlewareFn<Context> {
    return async (ctx, next) => {
      if (!ctx.from?.id || !ctx.chat?.id) {
        return ctx.reply('Invalid context or user information missing.');
      }

      const userId = ctx.from.id;
      const chatId = ctx.chat.id;

      const userMainRole = await this.telegramService.getUserRole(
        mainGroupId,
        userId,
      );
      const userCurrentRole = await this.telegramService.getUserRole(
        chatId,
        userId,
      );

      ctx.state.userMainRole = userMainRole;
      ctx.state.userCurrentRole = userCurrentRole;

      return next();
    };
  }
}
