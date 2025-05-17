import { Injectable, Logger } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { CityService } from '../city/city.service';
import { UserService } from '../user/user.service';
import { Command, Ctx, InjectBot } from 'nestjs-telegraf';
import { AccessService } from '../access/access.service';

type CityButton = { text: string; callback_data: string };
type InlineKeyboard = CityButton[][];

@Injectable()
export class BroadcastService {
  // TODO: Replace with your actual admin telegram user id
  private readonly HARDCODED_ADMIN_ID = 123456789;

  constructor(
    @InjectBot() private bot: Telegraf<Context>,
    private readonly cityService: CityService,
    private readonly userService: UserService,
    private readonly accessService: AccessService,
  ) {}

  @Command('broadcast')
  async onBroadcast(@Ctx() ctx: Context) {
    const user = ctx.from;
    const userId = user?.id;
    const username = user?.username;

    if (!userId) {
      await ctx.reply('User ID is undefined. Cannot determine user role.');
      return;
    }

    let userAccess;
    if (userId === this.HARDCODED_ADMIN_ID) {
      userAccess = [
        {
          role: 'admin',
          city_data: [],
        },
      ];
    } else {
      userAccess = await this.accessService.getUserAccess(userId.toString());
    }

    Logger.log(`User access for ${username}: ${JSON.stringify(userAccess)}`);

    if (userAccess === 'no access') {
      await ctx.reply('❌ You do not have access to broadcast messages.');
      return;
    }

    const accessData = userAccess[0];

    // Properly type buttons array to fix TS errors
    let buttons: InlineKeyboard = [];

    if (accessData.city_data && accessData.city_data.length > 0) {
      buttons = accessData.city_data.map((city) => [
        {
          text: city.city_name,
          callback_data: `broadcast_city_${city.city_id}`,
        },
      ]);
    }

    // Add the "Create post" button at the bottom
    buttons.push([
      {
        text: 'Create post',
        callback_data: 'create_post',
      },
    ]);

    await ctx.reply(`${username} Please select a city to broadcast the message:`, {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  async onCreatePost(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply('User ID is undefined. Cannot determine user role.');
      return;
    }

    // Admin override by hardcoded ID
    let userAccess;
    if (userId === this.HARDCODED_ADMIN_ID) {
      userAccess = [
        {
          role: 'admin',
          city_data: [],
        },
      ];
    } else {
      userAccess = await this.accessService.getUserAccess(userId.toString());
    }

    if (userAccess === 'no access') {
      await ctx.reply('❌ You do not have access to broadcast messages.');
      return;
    }

    const accessData = userAccess[0];
    const role = accessData.role;

    if (role === 'host') {
      await ctx.reply('You\'re assigned as admin to **"Colombo Pizza DAO"** chat', {
        parse_mode: 'Markdown',
      });
    } else if (role === 'admin') {
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
    } else if (role === 'underboss') {
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
    } else if (role === 'caporegime') {
      // Assuming you want to handle caporegime role here
      await ctx.reply(
        "You're assigned as **Caporegime** to your country Pizza DAO chats.\nSelect a Specific Group(s) to send the Broadcast Message",
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🏙️ Specific City', callback_data: 'broadcast_caporegime_city' },
                { text: '🌐 Specific Country', callback_data: 'broadcast_caporegime_country' },
              ],
            ],
          },
        },
      );
    } else {
      await ctx.reply('❌ You do not have access to broadcast messages.');
    }
  }
}
