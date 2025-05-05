import { Injectable } from '@nestjs/common';
import { BroadcastFlowService } from 'src/broadcast-flow/broadcast-flow.service';
import { Context, MiddlewareFn } from 'telegraf';

@Injectable()
export class RoleMiddleware {
  constructor(private telegramService: BroadcastFlowService) {}

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
