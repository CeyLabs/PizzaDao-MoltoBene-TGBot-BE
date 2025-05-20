import { Context, MiddlewareFn } from 'telegraf';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrivateChatMiddleware {
  use(): MiddlewareFn<Context> {
    return (ctx, next) => {
      // Allow all non-message updates (inline queries, callback queries, etc.)
      if (!ctx.chat && ctx.inlineQuery) {
        return next(); // allow inline mode
      }
      // Allow "new_chat_members" in any chat
      if (
        'message' in ctx &&
        ctx.message &&
        'new_chat_members' in ctx.message &&
        Array.isArray((ctx.message as any).new_chat_members)
      ) {
        return next();
      }
      // Allow only private chats for commands and text
      if (ctx.chat?.type === 'private') {
        return next();
      }
      // Block everything else (like group text/commands)
      return;
    };
  }
}
