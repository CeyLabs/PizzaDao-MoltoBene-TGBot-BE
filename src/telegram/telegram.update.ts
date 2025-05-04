import { Update, Ctx, Command, Action, On } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';
import { MyContext } from './telegram.context';

const MAIN_GROUP_ID = -1002418974575;
const SUB_GROUP_ID = -1002324184659;

@Update()
export class TelegramUpdate {
  constructor(private telegramService: TelegramService) {}

  @Command('broadcast')
  async broadcast(@Ctx() ctx: MyContext) {
    if (ctx.chat?.type !== 'private') {
      await ctx.reply(
        '❌ Please use this command in a private chat with the bot.',
      );
      return;
    }

    await ctx.reply('Where do you want to send this message?', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📤 Send to Sub Group Only',
              callback_data: 'broadcast_subgroup',
            },
          ],
          [{ text: '🌍 Send to All Groups', callback_data: 'broadcast_all' }],
          [
            {
              text: '🌍 Send to Super Group Only',
              callback_data: 'broadcast_supergroup',
            },
          ],
        ],
      },
    });
  }

  @Action('broadcast_subgroup')
  async handleSubGroup(@Ctx() ctx: MyContext) {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('Could not identify user.');
      return;
    }

    const role = await this.telegramService.getUserRole(SUB_GROUP_ID, userId);
    if (role !== 'creator' && role !== 'administrator') {
      await ctx.reply(
        '❌ You are not authorized to send messages to the subgroup.',
      );
      return;
    }

    ctx.session.broadcastTarget = 'subgroup';
    await ctx.reply(
      '✅ Please send the message you want to broadcast to the Sub Group.',
    );
  }

  @Action('broadcast_supergroup')
  async handleSuperGroup(@Ctx() ctx: MyContext) {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('Could not identify user.');
      return;
    }

    const role = await this.telegramService.getUserRole(MAIN_GROUP_ID, userId);
    if (role !== 'creator' && role !== 'administrator') {
      await ctx.reply(
        '❌ You are not authorized to send messages to the supergroup.',
      );
      return;
    }

    ctx.session.broadcastTarget = 'supergroup';
    await ctx.reply(
      '✅ Please send the message you want to broadcast to the Super Group.',
    );
  }

  @Action('broadcast_all')
  async handleAllGroup(@Ctx() ctx: MyContext) {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('Could not identify user.');
      return;
    }

    const role = await this.telegramService.getUserRole(MAIN_GROUP_ID, userId);
    if (role !== 'creator' && role !== 'administrator') {
      await ctx.reply('❌ You are not authorized to broadcast to all groups.');
      return;
    }

    ctx.session.broadcastTarget = 'all';
    await ctx.reply(
      '✅ Please send the message you want to broadcast to all groups.',
    );
  }

  @On('text')
  async handleText(@Ctx() ctx: MyContext) {
    if (ctx.chat?.type !== 'private' || !ctx.session?.broadcastTarget) return;

    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : null;
    if (!text) return;

    const target = ctx.session.broadcastTarget;

    if (target === 'all') {
      await this.broadcastToAllGroups(text, ctx);
      await ctx.reply('✅ Message sent to all groups.');
    } else if (target === 'subgroup') {
      await ctx.telegram.sendMessage(SUB_GROUP_ID, text);
      await ctx.reply('✅ Message sent to subgroup.');
    } else if (target === 'supergroup') {
      await ctx.telegram.sendMessage(MAIN_GROUP_ID, text);
      await ctx.reply('✅ Message sent to supergroup.');
    }

    ctx.session.broadcastTarget = null;
  }

  private async broadcastToAllGroups(message: string, ctx: MyContext) {
    const groupIds = [MAIN_GROUP_ID, SUB_GROUP_ID];
    for (const chatId of groupIds) {
      await ctx.telegram.sendMessage(chatId, message);
    }
  }
}
