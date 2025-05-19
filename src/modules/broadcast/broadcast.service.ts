import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import { Command, Ctx, On, Update } from 'nestjs-telegraf';
import { AccessService } from '../access/access.service';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { UserAccess, AdminAccessResult, UserAccessInfo } from './broadcast.type';

@Update()
@Injectable()
export class BroadcastService {
  private readonly SUPER_ADMIN_ID = process.env.ADMIN_ID;
  private readonly logger = new Logger(BroadcastService.name);

  constructor(private readonly accessService: AccessService) {}

  @Command('broadcast')
  async onBroadcast(@Ctx() ctx: Context) {
    const accessRole = await this.accessService.getAccessRole(String(ctx.from?.id));
    if (!accessRole) return;

    // show broadcast selection menu
    await this.showBroadcastMenu(ctx, accessRole);
  }

  private async showBroadcastMenu(ctx: Context, role: string) {
    try {
      const rawMessage = `Hello there *${role.charAt(0).toUpperCase() + role.slice(1)}* 👋
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

      const formattedMessage = this.escapeMarkdown(rawMessage);

      await ctx.reply(formattedMessage, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Create Post', callback_data: 'create_post' },
              { text: 'Update Variables', callback_data: 'update_variables' },
            ],
            [{ text: 'Invite new Admin', callback_data: 'invite_admin' }],
          ],
        },
      });
    } catch (error) {
      this.logger.error('Error displaying rich post interface:', error);
      await ctx.reply('❌ Failed to display post creation interface.');
    }
  }

  @On('callback_query')
  async handleCallbackQuery(ctx: Context) {
    const callbackData =
      ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;

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
    if (callbackData?.startsWith('broadcast_')) {
      await this.handleBroadcastSelection(ctx, callbackData);
      return;
    }

    // Handle create post button
    if (callbackData === 'create_post') {
      await this.showBroadcastSelectionUI(ctx);
      return;
    }

    await ctx.answerCbQuery();
  }

  /**
   * Get user access information
   */
  private async getUserAccessInfo(ctx: Context): Promise<UserAccessInfo | null> {
    const user = ctx.from;
    const userId = user?.id;
    const username = user?.username || 'User';

    if (!userId) {
      await ctx.reply('User ID is undefined\\. Cannot determine user role\\.', {
        parse_mode: 'MarkdownV2',
      });
      return null;
    }

    let userAccess: UserAccess[] | 'no access' | AdminAccessResult;
    let role: string;

    // Admin role handling
    if (userId.toString() === this.SUPER_ADMIN_ID?.toString()) {
      // Fetch admin access data
      userAccess = await this.accessService.getUserAccess(userId.toString());
      role = 'admin';
    } else {
      userAccess = await this.accessService.getUserAccess(userId.toString());

      if (userAccess === 'no access') {
        await ctx.reply('❌ You do not have access to broadcast messages\\.', {
          parse_mode: 'MarkdownV2',
        });
        return null;
      }
      role = userAccess[0].role;
    }

    return { userAccess, role, username, userId };
  }

  /**
   * Shows the broadcast selection UI based on user role
   */
  private async showBroadcastSelectionUI(ctx: Context) {
    const accessInfo = await this.getUserAccessInfo(ctx);
    if (!accessInfo) return;

    const { userAccess, role, username } = accessInfo;

    let message: string;
    let inline_keyboard: InlineKeyboardButton[][] = [];

    if (role === 'admin') {
      message = `*${username}*, You're assigned as *Super Admin* to all the Pizza DAO chats\\. Select a Specific Group\\(s\\) to send the Broadcast Message\\.`;
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
      const regionName =
        Array.isArray(userAccess) && userAccess[0]?.region_name ? userAccess[0].region_name : '';
      message = `*${username}*, You're assigned as *Underboss* to all the *${this.escapeMarkdown(regionName)}* Pizza DAO chats\\. Select a Specific Group\\(s\\) to send the Broadcast Message\\.`;
      inline_keyboard = [
        [
          { text: '🏙️ Specific City', callback_data: 'broadcast_underboss_city' },
          { text: '🌐 Specific Country', callback_data: 'broadcast_underboss_country' },
        ],
        [{ text: `All City Chats in ${regionName}`, callback_data: 'broadcast_all_region_cities' }],
      ];
    } else if (role === 'host') {
      const cityName =
        (Array.isArray(userAccess) && userAccess[0]?.city_data?.[0]?.city_name) ?? '';
      message = `*${username}*, You're assigned as Host to *"${this.escapeMarkdown(cityName || 'Unknown City')} Pizza DAO"* chat\\. Select an option below
      \nSend me one or multiple messages you want to include in the post\\. It can be anything — a text, photo, video, even a sticker\\.`;
    } else if (role === 'caporegime') {
      const countryName = (Array.isArray(userAccess) && userAccess[0]?.country_name) ?? '';
      message = `*${username}*, You're assigned as *Caporegime* to all the *${this.escapeMarkdown(countryName || 'Unknown Country')}* Pizza DAO chats\\. Select a Specific Group\\(s\\) to send the Broadcast Message\\.`;
      inline_keyboard = [
        [
          { text: '🏙️ Specific City', callback_data: 'broadcast_caporegime_city' },
          { text: '🌐 Specific Country', callback_data: 'broadcast_caporegime_country' },
        ],
        [
          {
            text: `All City Chats in ${countryName}`,
            callback_data: 'broadcast_all_caporegime_cities',
          },
        ],
      ];
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
        broadcast_caporegime_city: 'Caporegime City',
        broadcast_caporegime_country: 'Caporegime Country',
        broadcast_all_caporegime_cities: 'All Caporegime Cities',
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
        "📝 Let's create a new post\\! Please send me the message you want to broadcast\\.",
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

  private escapeMarkdown(text: string): string {
    return text.replace(/([\\`>#+\-=|{}.!])/g, '\\$1');
  }
}
