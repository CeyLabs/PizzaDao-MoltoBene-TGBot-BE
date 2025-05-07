import { Context, MiddlewareFn } from 'telegraf';

export const PrivateChatMiddleware: MiddlewareFn<Context> = (ctx, next) => {
  // Allow all non-message updates (inline queries, callback queries, etc.)
  if (!ctx.chat && ctx.inlineQuery) {
    return next(); // allow inline mode
  }

  // For message-based updates, allow only private chats
  if (ctx.chat?.type === 'private') {
    return next();
  }

  // Block everything else (like group messages)
  return;
};
