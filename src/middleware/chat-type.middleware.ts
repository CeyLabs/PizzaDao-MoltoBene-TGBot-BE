import { Context, MiddlewareFn } from 'telegraf';

export const PrivateChatMiddleware: MiddlewareFn<Context> = (ctx, next) => {
  if (ctx.chat?.type !== 'private') {
    return;
  }
  return next();
};
