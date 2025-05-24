import { Context, MiddlewareFn } from 'telegraf';
import { Injectable } from '@nestjs/common';

interface NewChatMembersMessage {
  new_chat_members: Array<{
    id: number;
    is_bot: boolean;
    first_name: string;
  }>;
}

@Injectable()
export class PrivateChatMiddleware {
  use(): MiddlewareFn<Context> {
    return async (ctx, next) => {
      // Allow all non-message updates (inline queries, callback queries, etc.)
      if (!ctx.chat && (ctx.inlineQuery || ctx.callbackQuery)) {
        return next();
      }

      // Allow "new_chat_members" in any chat
      if (
        'message' in ctx &&
        ctx.message &&
        'new_chat_members' in ctx.message &&
        Array.isArray((ctx.message as NewChatMembersMessage).new_chat_members)
      ) {
        return next();
      }

      // Send a message to /start command in groups
      if (
        ctx.chat?.type !== 'private' &&
        ctx.message &&
        'text' in ctx.message &&
        typeof ctx.message.text === 'string' &&
        (ctx.message.text === '/start' || ctx.message.text === '/start@MoltoBeneBot')
      ) {
        await ctx.reply(`MoltoBene Bot here!
Configuration looks perfect – I’m able to detect new users and greet them with their pizza names when I have admin access.

If you're seeing this message, that means I'm already in the group – just doing a quick check to confirm I have admin rights.

No need to run any commands here. I’ll handle the greetings and updates automatically from now on.

Stay saucy! 

Built with ❤️ From Sri Lanka`);
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
