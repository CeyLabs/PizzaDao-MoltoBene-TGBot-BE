import { Context } from 'telegraf';

// add a function that return context telegram user id as a string
export const getContextTelegramUserId = (ctx: Context): string | null => {
  if (ctx.message && ctx.message.from) {
    return ctx.message.from.id.toString();
  }

  if (ctx.from && ctx.from.id) {
    return ctx.from.id.toString();
  }

  if (ctx.chat && ctx.chat.id) {
    return ctx.chat.id.toString();
  }

  if (ctx.callbackQuery && ctx.callbackQuery.from && ctx.callbackQuery.from.id) {
    return ctx.callbackQuery.from.id.toString();
  }

  return null;
};
