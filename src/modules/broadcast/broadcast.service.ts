import { Injectable, Logger } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { Command, Ctx, InjectBot } from 'nestjs-telegraf';
import { AccessService } from '../access/access.service';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class BroadcastService {
  private readonly HARDCODED_ADMIN_ID = 123456789;
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    @InjectBot() private bot: Telegraf<Context>,
    private readonly accessService: AccessService,
  ) {
    this.bot.on('callback_query', async (ctx) => {
      const callbackQuery = ctx.callbackQuery;

      if (!('data' in callbackQuery)) {
        await ctx.answerCbQuery();
        return;
      }

      const callbackData = callbackQuery.data;

      // Handle host buttons
      if (
        callbackData === 'host_specific_city' ||
        callbackData === 'host_specific_country' ||
        callbackData === 'host_create_post'
      ) {
        const buttonNameMap: Record<string, string> = {
          host_specific_city: 'Specific City',
          host_specific_country: 'Specific Country',
          host_create_post: 'Create post',
        };
        const buttonName = buttonNameMap[callbackData] || 'Unknown button';
        await ctx.answerCbQuery(`You clicked on ${buttonName}`, { show_alert: true });

        if (callbackData === 'host_create_post') {
          await this.onCreatePost(ctx);
        }
        return;
      }

      // Handle broadcast buttons
      if (callbackData.startsWith('broadcast_')) {
        await this.handleBroadcastSelection(ctx, callbackData);
        return;
      }

      await ctx.answerCbQuery();
    });
  }

  @Command('broadcast')
  async onBroadcast(@Ctx() ctx: Context) {
    const user = ctx.from;
    const userId = user?.id;
    const username = user?.username || 'User';

    if (!userId) {
      await ctx.reply('User ID is undefined\\. Cannot determine user role\\.', {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    interface UserAccess {
      role: string;
      city_data?: { city_name: string }[];
      region_name?: string;
    }

    let userAccess: UserAccess[] | 'no access';
    let role: string;

    if (userId === this.HARDCODED_ADMIN_ID) {
      role = 'admin';
      userAccess = [
        {
          role,
          city_data: [],
        },
      ];
    } else {
      userAccess = await this.accessService.getUserAccess(userId.toString());

      if (userAccess === 'no access') {
        await ctx.reply('❌ You do not have access to broadcast messages\\.', {
          parse_mode: 'MarkdownV2',
        });
        return;
      }
      role = userAccess[0].role;
    }

    let message: string;
    let inline_keyboard: InlineKeyboardButton[][] = [];

    await this.displayRichPostInterface(ctx, role);

    if (role === 'admin') {
      message = `*${username}*, You're assigned as *super admin* to all the Pizza DAO chats\\. Select a Specific Group\\(s\\) to send the Broadcast Message\\.`;
      inline_keyboard = [
        [
          { text: '🌍 All City Chats', callback_data: 'broadcast_all_cities' },
          { text: '🏙️ Specific City', callback_data: 'broadcast_specific_city' },
        ],
        [
          { text: '📍 Specific Region', callback_data: 'broadcast_specific_region' },
          { text: '🌐 Specific Country', callback_data: 'broadcast_specific_country' },
        ],
      ];
    } else if (role === 'underboss') {
      const regionName = userAccess[0].region_name || '';
      message = `*${username}*, You're assigned as *underboss* to all the *${this.escapeMarkdown(regionName)}* Pizza DAO chats\\. Select a Specific Group\\(s\\) to send the Broadcast Message\\.`;
      inline_keyboard = [
        [
          { text: '🏙️ Specific City', callback_data: 'broadcast_underboss_city' },
          { text: '🌐 Specific Country', callback_data: 'broadcast_underboss_country' },
        ],
        [{ text: `All City Chats in ${regionName}`, callback_data: 'broadcast_all_region_cities' }],
      ];
    } else if (role === 'host') {
      const cityName = userAccess[0].city_data?.[0]?.city_name || '';
      message = `*${username}*, You're assigned as admin to *"${this.escapeMarkdown(cityName)} Pizza DAO"* chat\\. Select an option below
      \nSend me one or multiple messages you want to include in the post\\. It can be anything — a text, photo, video, even a sticker\\.`;
    } else {
      await ctx.reply('❌ You do not have access to broadcast messages\\.', {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard,
      },
    });
  }

  private async handleBroadcastSelection(ctx: Context, callbackData: string) {
    try {
      const actionMap: Record<string, string> = {
        broadcast_all_cities: 'All City Chats',
        broadcast_specific_city: 'Specific City',
        broadcast_specific_region: 'Specific Region',
        broadcast_specific_country: 'Specific Country',
        broadcast_underboss_city: 'Underboss City',
        broadcast_underboss_country: 'Underboss Country',
        broadcast_all_region_cities: 'All Region Cities',
      };

      const action = actionMap[callbackData] || 'Unknown action';
      await ctx.answerCbQuery(`Selected: ${action}`);
      this.logger.log(`Initiating broadcast for ${action}`);
      // Implement actual broadcast logic here
    } catch (error) {
      this.logger.error('Error handling broadcast selection:', error);
      await ctx.answerCbQuery('❌ Error processing your request');
    }
  }

  async onCreatePost(@Ctx() ctx: Context) {
    try {
      this.logger.log('Create post flow initiated');
      await ctx.reply(
        "📝 Let's create a new post! Please send me the message you want to broadcast.",
        {
          parse_mode: 'MarkdownV2',
          reply_markup: { remove_keyboard: true },
        },
      );
    } catch (error) {
      this.logger.error('Error in onCreatePost:', error);
      await ctx.reply('❌ Failed to start post creation. Please try again.');
    }
  }

  private async displayRichPostInterface(ctx: Context, role: string) {
    try {
      const formattedRole = `*${this.escapeMarkdown(role.charAt(0).toUpperCase() + role.slice(1))}*`;

      const rawMessage = `Hello there ${formattedRole} 👋
Here you can create rich posts, set Variables and Invite new Admins

Current Variables:
- City: Galle
- Country: Sri Lanka
- Date: 22nd May 2025
- Start Time: 06:00 PM
- End Time: 09:00 PM
- Venue: Pizza Den
- Venue Link: https://t.co/sSsfnwwhAd
- Unlock Link: https://app.unlock-protocol.com/event/global-pizza-party-kandy-1
- X Post: https://x.com/pizzadao/fsda
- Admins: @naveensavishka`;

      const escapedMessage = this.escapeMarkdown(rawMessage);

      const inline_keyboard: InlineKeyboardButton[][] = [
        [
          { text: 'Create Post', callback_data: 'create_post' },
          { text: 'Update Variables', callback_data: 'update_variables' },
        ],
        [{ text: 'Invite new Admin', callback_data: 'invite_admin' }],
      ];

      await ctx.reply(escapedMessage, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard,
        },
      });
    } catch (error) {
      this.logger.error('Error displaying rich post interface:', error);
      await ctx.reply('❌ Failed to display post creation interface.');
    }
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/([\\`>#+\-=|{}.!])/g, '\\$1');
  }
}
