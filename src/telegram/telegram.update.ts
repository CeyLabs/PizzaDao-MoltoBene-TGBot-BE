import { Update, Ctx, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { RoleMiddleware } from './middleware/role.middleware';
import { Use } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';

const MAIN_GROUP_ID = -1002418974575; // Replace with actual main group ID

@Update()
export class TelegramUpdate {
  constructor(private telegramService: TelegramService) {}

  @Command('broadcast')
  async broadcast(@Ctx() ctx: Context) {
    const roleMiddleware = new RoleMiddleware(this.telegramService);
    await roleMiddleware.roleValidationMiddleware(MAIN_GROUP_ID)(
      ctx,
      async () => {
        if (!ctx.message || !('text' in ctx.message)) {
          await ctx.reply('Please provide a valid text message.');
          return;
        }

        const userMainRole = ctx.state.userMainRole;
        const userCurrentRole = ctx.state.userCurrentRole;
        const messageText = ctx.message.text.replace('/broadcast', '').trim();

        if (!messageText) {
          await ctx.reply('Please provide a message to broadcast.');
          return;
        }

        if (!ctx.chat) {
          await ctx.reply('Chat context not available.');
          return;
        }

        const currentChatId = ctx.chat.id;

        // ✅ Only allow full broadcast if:
        // - user is admin/creator in MAIN group
        // - and message is sent from MAIN group
        const isFromMainGroup = currentChatId === MAIN_GROUP_ID;
        const isMainAdmin =
          userMainRole === 'creator' || userMainRole === 'administrator';

        if (isMainAdmin && isFromMainGroup) {
          await this.broadcastToAllGroups(messageText, ctx);
          await ctx.reply('Broadcasted to all groups.');
          return;
        }

        // ✅ Allow broadcasting only in current group if user is local admin
        if (
          userCurrentRole === 'creator' ||
          userCurrentRole === 'administrator'
        ) {
          await ctx.telegram.sendMessage(currentChatId, messageText);
          await ctx.reply('Broadcasted to your group only.');
          return;
        }

        await ctx.reply('You do not have permission to broadcast.');
      },
    );
  }

  private async broadcastToAllGroups(message: string, ctx: Context) {
    const groupIds = [MAIN_GROUP_ID, -1002324184659];

    for (const chatId of groupIds) {
      await ctx.telegram.sendMessage(chatId, message);
    }
  }
}
