import { Injectable, Logger } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { CityService } from '../city/city.service';
import { UserService } from '../user/user.service';
import { Command, Ctx, InjectBot } from 'nestjs-telegraf';
import { AccessService } from '../access/access.service';

@Injectable()
export class BroadcastService {
  constructor(
    @InjectBot() private bot: Telegraf<Context>,
    private readonly cityService: CityService,
    private readonly userService: UserService,
    private readonly accessService: AccessService,
  ) {}

  @Command('broadcast')
  async onBroadcast(@Ctx() ctx: Context) {
    // get telegram chat username
    const user = ctx.from;
    const userId = ctx.from?.id;
    const username = user?.username;

    if (!userId) {
      await ctx.reply('User ID is undefined. Cannot determine user role.');
      return;
    }
    const userRole = await this.accessService.getRoleByTelegramId(userId.toString());

    Logger.log(`User role for ${username}: ${userRole}`);

    if (!userRole || !['admin', 'host', 'underboss'].includes(userRole)) {
      await ctx.reply('❌ You do not have access to broadcast messages.');
      return;
    }

    await ctx.reply(`${username} Please select a city to broadcast the message:`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Create post',
              callback_data: 'create_post',
            },
          ],
        ],
      },
    });
  }

  async onCreatePost(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply('User ID is undefined. Cannot determine user role.');
      return;
    }

    const userRole = await this.accessService.getRoleByTelegramId(userId.toString());

    if (userRole === 'host') {
      await ctx.reply('You\'re assigned as admin to **"Colombo Pizza DAO"** chat');
    } else if (userRole === 'admin') {
      await ctx.reply(
        "You're assigned as **super admin** to all the **Pizza DAO chats.**\nSelect a Specific Group(s) to send the Broadcast Message",
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🌍 All City Chats', callback_data: 'broadcast_all_cities' },
                { text: '🏙️ Specific City', callback_data: 'broadcast_specific_city' },
              ],
              [
                { text: '📍 Specific Region', callback_data: 'broadcast_specific_region' },
                { text: '🌐 Specific Country', callback_data: 'broadcast_specific_country' },
              ],
            ],
          },
        },
      );
    } else if (userRole === 'underboss') {
      await ctx.reply(
        "You're assigned as **Underboss** to all the **Asia Pizza DAO** chats.\nSelect a Specific Group(s) to send the Broadcast Message",
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🏙️ Specific City', callback_data: 'broadcast_underboss_city' },
                { text: '🌐 Specific Country', callback_data: 'broadcast_underboss_country' },
              ],
              [{ text: 'All City Chats in Asia', callback_data: 'broadcast_all_asia_cities' }],
            ],
          },
        },
      );
    } else {
      await ctx.reply('❌ You do not have access to broadcast messages.');
    }
  }
}
