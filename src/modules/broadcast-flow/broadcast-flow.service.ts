import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { BroadcastMessage, BroadcastResult, BroadcastState } from './broadcast-flow.interface';
import { CityService } from '../city/city.service';
import {
  InlineKeyboardButton,
  InlineQueryResultArticle,
} from 'telegraf/typings/core/types/typegram';
import { helpMessage, welcomeMessage } from 'src/bot-commands';
import { randomBytes } from 'crypto';
import { UserService } from '../user/user.service';
import { Action, Command, Ctx, Hears, On, Start, Update } from 'nestjs-telegraf';

@Injectable()
@Update()
export class BroadcastFlowService {
  private readonly userStates: Map<number, BroadcastState> = new Map();
  private readonly logger = new Logger(BroadcastFlowService.name);

  constructor(
    @InjectBot() private bot: Telegraf<Context>,
    private readonly cityService: CityService,
    private readonly userService: UserService,
  ) {}

  getSession(userId: number): BroadcastState {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, {
        step: 'idle',
        message: {
          scope: 'all',
          content: '',
        },
      });
    }
    return this.userStates.get(userId)!;
  }

  resetState(userId: number): void {
    this.userStates.set(userId, {
      step: 'idle',
      message: {
        scope: 'all',
        content: '',
      },
    });
  }

  async showMainKeyboardAfterInlineQuery(ctx: Context) {
    try {
      // For inline query responses, we need to ensure we're sending a new message
      await ctx.reply(
        '✨ What would you like to do today? ✨',
        Markup.keyboard([['🔊 Broadcast Message']]).resize(),
      );
    } catch (error) {
      console.error('Error showing main keyboard:', error);
    }
  }

  async showConfirmation(ctx: Context, message: BroadcastMessage) {
    // Build message preview
    let previewText = '📢 *Broadcast Preview:*\n\n';

    if (message.city) {
      previewText += `📍 *${message.city}*\n`;
    }

    previewText += message.content;

    if (message.place) {
      previewText += `\n\n🏢 *Venue:* ${message.place}`;
    }

    if (message.date) {
      previewText += `\n📅 *Date:* ${message.date}`;
    }

    if (message.time) {
      previewText += `\n⏰ *Time:* ${message.time}`;
    }

    if (message.externalLinks) {
      previewText += `\n🔗 *Links:* ${message.externalLinks}`;
    }

    if (message.buttonText && message.buttonUrl) {
      previewText += `\n\n🔘 *Button:* [${message.buttonText}](${message.buttonUrl})`;
    }

    previewText += '\n\n*Target:* ';
    previewText += message.scope === 'all' ? '🌎 All Groups' : `🏙️ City - ${message.city}`;

    // Send the preview with confirmation buttons
    await ctx.reply(previewText, {
      parse_mode: 'Markdown',
      // disable_web_page_preview: true,
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('📢 Broadcast', 'confirm_broadcast'),
          Markup.button.callback('📌 Broadcast with Pin', 'confirm_broadcast_pin'),
        ],
        [Markup.button.callback('❌ Cancel', 'cancel_broadcast')],
      ]),
    });
  }

  showCancelOption(
    ctx: Context,
    message: string,
    options: Record<string, any> = {},
  ): Promise<unknown> {
    const inlineKeyboard: InlineKeyboardButton[][] = Array.isArray(
      (options.reply_markup as { inline_keyboard?: InlineKeyboardButton[][] })?.inline_keyboard,
    )
      ? (options.reply_markup as { inline_keyboard: InlineKeyboardButton[][] }).inline_keyboard
      : [];

    // Add a cancel button as the last row if it's not already there
    const hasCancelButton = inlineKeyboard.some((row) =>
      row.some(
        (button: InlineKeyboardButton) =>
          'callback_data' in button && button.callback_data === 'cancel_broadcast',
      ),
    );

    if (!hasCancelButton) {
      inlineKeyboard.push([Markup.button.callback('❌ Cancel', 'cancel_broadcast')]);
    }

    return ctx.reply(message, {
      ...options,
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    }) as Promise<unknown>;
  }

  async promptForMessageContent(ctx: any) {
    await this.showCancelOption(
      ctx,
      '✏️ *Please enter your message content:* (required)\n\nType your announcement message below.',
      { parse_mode: 'Markdown' },
    );
  }

  async promptForPlace(ctx: Context) {
    await ctx.reply('🏢 *Enter venue/place:* (optional)\n\nWhere is this event taking place?', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('⏩ Skip', 'skip_place')],
        [Markup.button.callback('❌ Cancel', 'cancel_broadcast')],
      ]),
    });
  }

  async promptForDate(ctx: Context) {
    await ctx.reply('📅 *Enter date:* (optional)\n\nWhen is this happening?', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('⏩ Skip', 'skip_date')],
        [Markup.button.callback('❌ Cancel', 'cancel_broadcast')],
      ]),
    });
  }

  async promptForTime(ctx: Context) {
    await ctx.reply('⏰ *Enter time:* (optional)\n\nAt what time?', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('⏩ Skip', 'skip_time')],
        [Markup.button.callback('❌ Cancel', 'cancel_broadcast')],
      ]),
    });
  }

  async promptForLinks(ctx: Context) {
    await ctx.reply('🔗 *Enter external links:* (optional)\n\nAny relevant links to include?', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('⏩ Skip', 'skip_links')],
        [Markup.button.callback('❌ Cancel', 'cancel_broadcast')],
      ]),
    });
  }

  async handleCitySelection(ctx: Context, selectedCity: string): Promise<number | null> {
    const userId: number | undefined = ctx.from?.id;
    if (!userId) return null;

    const state = this.getSession(userId);
    const cityGroups = await this.getGroupsByCity(selectedCity);

    if (!cityGroups) {
      await ctx.reply('❌ Invalid city selected. Please try again.');
      return null;
    }

    const group = cityGroups[0];

    const isAdmin = await this.validateCityAdmin(selectedCity, userId.toString());

    if (!isAdmin) {
      await ctx.reply(`❌ You are not authorized to send messages to the ${selectedCity} group.`);
      return null;
    }

    state.message.city = selectedCity;
    state.message.scope = 'city';
    state.step = 'collect_message';

    await ctx.reply(
      `🏙️ *Selected city: ${selectedCity}*\n\nNow, let's collect your message details.`,
      { parse_mode: 'Markdown' },
    );

    await this.promptForMessageContent(ctx);
    return Number(group.group_id);
  }

  async handleCancel(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    this.resetState(userId);

    await ctx.reply(
      '❌ *Broadcast canceled*\n\nYour broadcast has been canceled. What would you like to do next?',
      {
        parse_mode: 'Markdown',
      },
    );
  }

  async getGroupsByCity(city: string): Promise<{ group_id: string; name: string }[]> {
    return this.cityService.getGroupsByCityId(city);
  }

  async validateCityAdmin(cityName: string, userId: string): Promise<boolean> {
    // Fetch admin_ids for the city
    const adminIds = await this.cityService.getCityAdminsByName(cityName);

    if (!adminIds) {
      this.logger.warn(`No admin information found for the city: ${cityName}`);
      return false;
    }

    return adminIds.includes(userId);
  }

  async getAllCities(): Promise<string[]> {
    const cities = await this.cityService.getAllCitiesWithGroups();

    return cities.map((city) => city.name);
  }

  async broadcastMessage(message: BroadcastMessage, ctx: Context): Promise<BroadcastResult> {
    let targetGroups: { group_id: string; name: string }[] = [];
    const userId = ctx.from?.id ?? null;

    this.logger.log(`Broadcasting message by user ID: ${userId}`);

    try {
      // Determine target groups based on scope and permissions
      if (message.scope === 'all') {
        targetGroups = await this.cityService.getAllCitiesWithGroups();
      } else if (message.scope === 'city' && message.city) {
        // Check if user has admin rights for this city
        targetGroups = await this.cityService.getGroupsByCityId(message.city);
      }

      if (targetGroups.length === 0) {
        return {
          success: false,
          message: 'No groups found for broadcasting.',
          groupCount: 0,
        };
      }

      this.logger.log(
        `Found ${targetGroups.length} target groups for broadcasting: ${targetGroups.map((g) => g.name).join(', ')}`,
      );

      // Build the message text
      let messageText = message.content;

      if (message.city) {
        messageText = `📍 ${message.city}\n${messageText}`;
      }

      if (message.place) {
        messageText = `${messageText}\n🏢 Venue: ${message.place}`;
      }

      if (message.date) {
        messageText = `${messageText}\n📅 Date: ${message.date}`;
      }

      if (message.time) {
        messageText = `${messageText}\n⏰ Time: ${message.time}`;
      }

      if (message.externalLinks) {
        messageText = `${messageText}\n🔗 Links: ${message.externalLinks}`;
      }

      // Send the message to each group
      const successfulGroups: string[] = [];
      const failedGroups: string[] = [];
      const errorDetails: Record<string, string> = {};

      let sentMessage: { message_id: number } | undefined;

      for (const group of targetGroups) {
        try {
          if (!group.group_id) {
            this.logger.warn(`Skipping group ${group.name} due to missing chatId.`);
            failedGroups.push(group.name);
            errorDetails[group.name] = 'Missing chatId';
            continue;
          }

          this.logger.log(`Broadcasting to group: ${group.name} (${group.group_id})`);

          // Prepare message options
          const messageOptions: {
            parse_mode: 'Markdown' | 'HTML';
            reply_markup?: {
              inline_keyboard: { text: string; url: string }[][];
            };
          } = {
            parse_mode: 'Markdown',
          };

          // Add inline keyboard if button exists
          if (message.buttonText && message.buttonUrl) {
            messageOptions.reply_markup = {
              inline_keyboard: [[{ text: message.buttonText, url: message.buttonUrl }]],
            };
          }

          // Send message (with or without image)
          if (message.image) {
            this.logger.log(`Sending image message to ${group.name}`);

            try {
              sentMessage = await ctx.telegram.sendPhoto(group.group_id, message.image, {
                caption: messageText,
                parse_mode: messageOptions.parse_mode,
                reply_markup: messageOptions.reply_markup,
              });
              successfulGroups.push(group.name);
              this.logger.log(`Successfully sent image message to ${group.name}`);
            } catch (error) {
              this.logger.error(
                `Error sending photo to ${group.name}: ${(error as Error).message || 'Unknown error'}`,
              );
              failedGroups.push(group.name);
              errorDetails[group.name] = (error as Error).message || 'Unknown error';
              continue;
            }
          } else {
            this.logger.log(`Sending text message to ${group.name}`);

            try {
              sentMessage = await ctx.telegram.sendMessage(
                group.group_id,
                messageText,
                messageOptions,
              );
              successfulGroups.push(group.name);
              this.logger.log(`Successfully sent text message to ${group.name}`);
            } catch (error) {
              this.logger.error(
                `Error sending message to ${group.name}: ${(error as Error).message || 'Unknown error'}`,
              );
              failedGroups.push(group.name);
              errorDetails[group.name] = (error as Error).message || 'Unknown error';
              continue;
            }
          }

          // Pin message if requested
          if (message.pin && sentMessage) {
            this.logger.log(`Pinning message in ${group.name}`);

            try {
              await ctx.telegram.pinChatMessage(group.group_id, sentMessage?.message_id ?? 0);
              this.logger.log(`Successfully pinned message in ${group.name}`);
            } catch (error) {
              this.logger.warn(
                `Failed to pin message in ${group.name}: ${(error as Error).message || 'Unknown error'}`,
              );
              // We don't consider pin failures as a broadcast failure
            }
          }
        } catch (error) {
          this.logger.error(`Error broadcasting to group ${group.name}:`, error);
          failedGroups.push(group.name);
          errorDetails[group.name] = (error as Error).message || 'Unknown error';
        }
      }

      // Determine overall success/failure
      if (failedGroups.length === 0) {
        return {
          success: true,
          message: `Successfully broadcasted to all ${successfulGroups.length} groups.`,
          groupCount: successfulGroups.length,
        };
      } else if (successfulGroups.length > 0) {
        return {
          success: true,
          message: `Broadcast was successful to ${successfulGroups.length} groups but failed for ${failedGroups.length} groups.`,
          groupCount: successfulGroups.length,
          failedGroups,
          errorDetails,
        };
      } else {
        let errorMessage = 'Broadcast failed for all target groups.';

        // Add detailed error information
        if (Object.keys(errorDetails).length > 0) {
          errorMessage += '\n\nError details:';
          Object.entries(errorDetails).forEach(([group, error]) => {
            errorMessage += `\n- ${group}: ${error}`;
          });
        }

        return {
          success: false,
          message: errorMessage,
          groupCount: 0,
          failedGroups,
          errorDetails,
        };
      }
    } catch (error: unknown) {
      this.logger.error('Broadcast error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `An error occurred during broadcast: ${errorMessage}`,
        groupCount: 0,
      };
    }
  }

  // Helper methods moved from controller
  private isValidDate(dateStr: string): boolean {
    // Expected format: DD/MM/YYYY
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(dateStr)) return false;

    const [, day, month, year] = dateRegex.exec(dateStr) || [];
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    // Check if date is valid and not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      date.getDate() === parseInt(day) &&
      date.getMonth() === parseInt(month) - 1 &&
      date.getFullYear() === parseInt(year) &&
      date >= today
    );
  }

  private isValidTime(timeStr: string): boolean {
    // Expected format: H:MM or HH:MM (24-hour format)
    const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(timeStr)) return false;

    const [, hours, minutes] = timeRegex.exec(timeStr) || [];
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);

    return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
  }

  // Handlers from controller

  @Command('cityselect')
  async handleCitySelectCommand(@Ctx() ctx: Context) {
    if (!ctx.from?.id || !ctx.message || !('text' in ctx.message)) return;
    const selectedCity = ctx.message.text.split(' ').slice(1).join(' ').trim();
    await this.handleCitySelection(ctx, selectedCity);
  }

  @Start()
  async onStartCommand(@Ctx() ctx: Context) {
    // Reset user state
    const userId: number | undefined = ctx.from?.id;
    if (userId) {
      this.resetState(userId);
    }

    const firstName = ctx.from?.first_name || 'there';

    // Welcome message with emoji and formatting
    const personalizedWelcomeMessage = `
🎉 *Welcome, ${firstName}!* 🎉

${welcomeMessage}
`;

    // Send welcome message with command buttons
    await ctx.reply(personalizedWelcomeMessage, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔊 Broadcast Message', 'start_broadcast')],
        [Markup.button.callback('❓ Help', 'show_help')],
      ]),
    });
  }

  @Hears(['🔊 Broadcast Message', 'Broadcast Message'])
  @Command('broadcast')
  async onBroadcast(@Ctx() ctx: Context) {
    const userId: number | undefined = ctx.from?.id;
    if (!userId) return;

    const isAdmin = await this.userService.isUserAdmin(userId);
    if (!isAdmin) {
      await ctx.reply('❌ You are not authorized to broadcast messages.');
      return;
    }

    const state = this.getSession(userId);
    state.step = 'select_scope';

    const buttons: InlineKeyboardButton[][] = [];

    buttons.push([Markup.button.callback('🌎 All Groups', 'scope_all')]);

    // Show "City" option to all admins
    buttons.push([Markup.button.callback('🏙️ City', 'scope_city')]);

    // Add cancel button
    buttons.push([Markup.button.callback('❌ Cancel', 'cancel_broadcast')]);

    await ctx.reply('📢 *Select broadcast target:*\n\nWhere would you like to send your message?', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons),
    });
  }

  @Action('start_broadcast')
  async onStartBroadcast(@Ctx() ctx: Context) {
    if (ctx.answerCbQuery) {
      await ctx.answerCbQuery();
    }
    await ctx.deleteMessage();
    await this.onBroadcast(ctx);
  }

  @Command(['help', 'h'])
  @Action('show_help')
  async showHelp(@Ctx() ctx: Context) {
    try {
      // Answer callback query if this came from a button
      if ('callback_query' in ctx.update) {
        if ('answerCbQuery' in ctx && typeof ctx.answerCbQuery === 'function') {
          await ctx.answerCbQuery();
        }
      }

      const helpText = helpMessage;

      const replyOptions = {
        parse_mode: 'Markdown' as const,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Start', callback_data: 'back_to_start' }],
            [{ text: '📢 Start Broadcast', callback_data: 'start_broadcast' }],
          ],
        },
      };

      // Different handling for callback vs command
      if ('message' in ctx.update) {
        await ctx.reply(helpText, replyOptions);
      } else {
        await ctx.editMessageText(helpText, replyOptions);
      }
    } catch (error) {
      Logger.error('Help command failed:', error);
      await ctx.reply('Failed to show help. Please try again.', {
        parse_mode: 'Markdown',
      });
    }
  }

  @Action('back_from_city')
  async onBackFromCity(@Ctx() ctx: Context) {
    if (typeof ctx.answerCbQuery === 'function') {
      await ctx.answerCbQuery();
    }
    const userId: number | undefined = ctx.from?.id;
    if (!userId) return;

    // Reset the user's state to 'select_scope'
    const state = this.getSession(userId);
    state.step = 'select_scope';

    const buttons: InlineKeyboardButton[][] = [];
    buttons.push([Markup.button.callback('🌎 All Groups', 'scope_all')]);
    buttons.push([Markup.button.callback('🏙️ City', 'scope_city')]);
    buttons.push([Markup.button.callback('❌ Cancel', 'cancel_broadcast')]);

    await ctx.editMessageText?.(
      '📢 *Select broadcast target:*\n\nWhere would you like to send your message?',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons),
      },
    );
  }

  @Action('back_to_start')
  async onBackToStart(@Ctx() ctx: Context) {
    if (typeof ctx.answerCbQuery === 'function') {
      await ctx.answerCbQuery();
    }
    const firstName = ctx.from?.first_name || 'there';

    await ctx.editMessageText(
      `
🎉 *Welcome back, ${firstName}!* 🎉

I'm your Broadcasting Assistant, here to help you share messages with your Telegram communities!

*What can I do?*
📢 Send announcements to multiple groups
🏙️ Target messages to specific cities
🖼️ Include images and buttons in your broadcasts
📌 Pin important messages

Ready to get started?
`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔊 Broadcast Message', 'start_broadcast')],
          [Markup.button.callback('❓ Help', 'show_help')],
        ]),
      },
    );
  }

  @Action(/^scope_(.+)$/)
  async onScopeSelect(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getSession(userId);
    const scopeMatch = Array.isArray((ctx as Context & { match: RegExpExecArray }).match)
      ? ((ctx as Context & { match: RegExpExecArray }).match[1] as string | undefined)
      : undefined;

    if (scopeMatch === 'all') {
      const isAdmin = await this.validateCityAdmin('MAIN_CITY_NAME', userId.toString()); // Replace 'MAIN_CITY_NAME' with the actual city name

      if (!isAdmin) {
        await ctx.reply('❌ You are not authorized to broadcast to all groups.');
        return;
      }

      state.message.scope = 'all';
      state.step = 'collect_message';
      await ctx.editMessageText(
        "🌎 *Broadcasting to all groups*\n\nNow, let's collect your message details.",
        { parse_mode: 'Markdown' },
      );
      await this.promptForMessageContent(ctx);
    } else if (scopeMatch === 'city') {
      state.message.scope = 'city';
      state.step = 'select_city';

      const cityButtons: InlineKeyboardButton[][] = [
        [Markup.button.switchToCurrentChat('🔍 Search City', '')],
        [Markup.button.callback('🔙 Back to main', 'back_from_city')],
        [Markup.button.callback('❌ Cancel', 'cancel_broadcast')],
      ];

      await ctx.editMessageText(
        '🏙️ *Select a city:*\n\nChoose the city where you want to broadcast your message.',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(cityButtons),
        },
      );
    }
  }

  @On('inline_query')
  async handleInlineQuery(@Ctx() ctx: Context) {
    const query =
      ctx.inlineQuery?.query && typeof ctx.inlineQuery.query === 'string'
        ? ctx.inlineQuery.query.trim().toLowerCase()
        : '';
    const offset =
      ctx.inlineQuery && typeof ctx.inlineQuery.offset === 'string'
        ? parseInt(ctx.inlineQuery?.offset || '0')
        : 0;
    const pageSize = 20;

    const allCities = await this.getAllCities();
    const filtered = query
      ? allCities.filter((city) => city.toLowerCase().includes(query))
      : allCities;

    const results: InlineQueryResultArticle[] = filtered
      .slice(offset, offset + pageSize)
      .map((city) => ({
        type: 'article',
        id: randomBytes(8).toString('hex'),
        title: city,
        description: `Broadcast to ${city}`,
        input_message_content: {
          message_text: `/cityselect ${city}`,
          parse_mode: 'Markdown',
        },
      }));

    const nextOffset = offset + pageSize < filtered.length ? `${offset + pageSize}` : '';

    await ctx.answerInlineQuery?.(results, {
      cache_time: 0,
      is_personal: true,
      next_offset: nextOffset,
    });
  }

  @Action(/^city_(.+)$/)
  async onCitySelect(@Ctx() ctx: Context & { match: RegExpExecArray }) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();
    const selectedCity = ctx.match[1];
    const SUB_GROUP_ID = await this.handleCitySelection(ctx, selectedCity);

    if (!SUB_GROUP_ID) {
      await ctx.reply('❌ Invalid city selected. Please try again.');
      return;
    }
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const state = this.getSession(userId);
    const text =
      ctx.message && 'text' in ctx.message && typeof ctx.message.text === 'string'
        ? ctx.message.text
        : '';

    // Skip processing if the text is a command
    if (typeof text === 'string' && text.startsWith('/')) {
      if (text === '/cancel') {
        await this.handleCancel(ctx);
      }
      return;
    }

    // If the text is "Broadcast Message" and we're not in an active flow, start the flow
    if (
      (text === '🔊 Broadcast Message' || text === 'Broadcast Message') &&
      (state.step === 'idle' || state.step === 'completed')
    ) {
      await this.onBroadcast(ctx);
      return;
    }

    // Process other text messages based on current step
    switch (state.step) {
      case 'collect_message':
        if (typeof text === 'string') {
          state.message.content = text;
        } else {
          Logger.warn('Invalid message content type received.');
          await ctx.reply('❌ Invalid message content. Please try again.');
          return;
        }
        state.step = 'collect_place';
        await this.promptForPlace(ctx);
        break;

      case 'collect_place':
        if (typeof text === 'string' && text.toLowerCase() !== 'skip') {
          state.message.place = text;
        }
        state.step = 'collect_date';
        await this.promptForDate(ctx);
        break;

      case 'collect_date':
        if (typeof text === 'string' && text.toLowerCase() !== 'skip') {
          if (!this.isValidDate(text)) {
            await ctx.reply(
              '❌ *Invalid date format*\n\n' +
                'Please enter the date in DD/MM/YYYY format.\n' +
                'For example: 25/12/2025\n\n' +
                '• Date must be in the future\n' +
                '• Month should be between 01-12\n' +
                '• Day should be valid for the given month\n\n' +
                'Or type "skip" to skip this step.',
              { parse_mode: 'Markdown' },
            );
            return;
          }
          state.message.date = text;
        }
        state.step = 'collect_time';
        await this.promptForTime(ctx);
        break;

      case 'collect_time':
        if (typeof text === 'string' && text.toLowerCase() !== 'skip') {
          if (!this.isValidTime(text)) {
            await ctx.reply(
              '❌ *Invalid time format*\n\n' +
                'Please enter the time in 24-hour format (HH:MM).\n' +
                'For example: 14:30 or 09:00\n\n' +
                '• Hours should be between 00-23\n' +
                '• Minutes should be between 00-59\n\n' +
                'Or type "skip" to skip this step.',
              { parse_mode: 'Markdown' },
            );
            return;
          }
          state.message.time = text;
        }
        state.step = 'collect_links';
        await this.promptForLinks(ctx);
        break;

      case 'collect_links':
        if (
          typeof text !== 'string' ||
          (!text.startsWith('http://') &&
            !text.startsWith('https://') &&
            text.toLowerCase() !== 'skip')
        ) {
          await ctx.reply(
            '⚠️ Please enter a valid URL starting with http:// or https:// or type "skip"',
          );
          return;
        }

        if (text.toLowerCase() !== 'skip') {
          state.message.externalLinks = text;
        }

        state.step = 'ask_image';

        await ctx.reply('🖼️ *Would you like to add an image to this message?*', {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('✅ Yes', 'image_yes'),
              Markup.button.callback('❌ No', 'image_no'),
            ],
            [Markup.button.callback('❌ Cancel Broadcast', 'cancel_broadcast')],
          ]),
        });
        break;

      case 'collect_button_text':
        if (typeof text === 'string') {
          state.message.buttonText = text;
        } else {
          Logger.warn('Invalid button text type received.');
          await ctx.reply('❌ Invalid button text. Please try again.');
          return;
        }
        state.step = 'collect_button_url';
        await this.showCancelOption(
          ctx,
          '🔗 *Enter the URL for the button:*\n\nThis should be a valid URL starting with http:// or https://',
          { parse_mode: 'Markdown' },
        );
        break;

      case 'collect_button_url':
        // Simple URL validation
        if (
          typeof text !== 'string' ||
          (!text.startsWith('http://') && !text.startsWith('https://'))
        ) {
          await ctx.reply('⚠️ Please enter a valid URL starting with http:// or https://');
          return;
        }

        state.message.buttonUrl = text;
        state.step = 'confirmation';
        await this.showConfirmation(ctx, state.message);
        break;
    }
  }

  @Action('skip_place')
  async onSkipPlace(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery('Skipped venue/place');

    const state = this.getSession(userId);
    state.step = 'collect_date';

    await ctx.deleteMessage();
    await this.promptForDate(ctx);
  }

  @Action('skip_date')
  async onSkipDate(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery('Skipped date');

    const state = this.getSession(userId);
    state.step = 'collect_time';

    await ctx.deleteMessage();
    await this.promptForTime(ctx);
  }

  @Action('skip_time')
  async onSkipTime(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery('Skipped time');

    const state = this.getSession(userId);
    state.step = 'collect_links';

    await ctx.deleteMessage();
    await this.promptForLinks(ctx);
  }

  @Action('skip_links')
  async onSkipLinks(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery('Skipped external links');

    const state = this.getSession(userId);
    state.step = 'ask_image';

    await ctx.deleteMessage();

    await ctx.reply('🖼️ *Would you like to add an image to this message?*', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Yes', 'image_yes'),
          Markup.button.callback('❌ No', 'image_no'),
        ],
        [Markup.button.callback('❌ Cancel Broadcast', 'cancel_broadcast')],
      ]),
    });
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const state = this.getSession(userId);

    if (state.step === 'collect_image') {
      // Get the file ID of the highest resolution photo
      const photoFileId =
        ctx.message &&
        ctx.message &&
        'photo' in ctx.message &&
        Array.isArray(ctx.message.photo) &&
        ctx.message.photo.length > 0 &&
        'file_id' in ctx.message.photo[ctx.message.photo.length - 1]
          ? ctx.message.photo[ctx.message.photo.length - 1].file_id
          : null;

      if (!photoFileId) {
        await ctx.reply('❌ Unable to process the photo. Please try again.');
        return;
      }
      state.message.image = photoFileId;
      state.step = 'ask_button';

      await ctx.reply('🔘 *Would you like to include a button?*', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Yes', 'button_yes'),
            Markup.button.callback('❌ No', 'button_no'),
          ],
          [Markup.button.callback('❌ Cancel Broadcast', 'cancel_broadcast')],
        ]),
      });
    } else {
      await ctx.reply('❌ Please send the image when prompted.');
      return;
    }
  }

  @Action('image_yes')
  async onImageYes(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getSession(userId);
    state.step = 'collect_image';

    await ctx.editMessageText(
      '📸 *Please send an image for the broadcast:*\n\nUpload a photo to include with your message.',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'cancel_broadcast')]]),
      },
    );
  }

  @Action('image_no')
  async onImageNo(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getSession(userId);
    state.step = 'ask_button';

    await ctx.editMessageText('🔘 *Would you like to include a button?*', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Yes', 'button_yes'),
          Markup.button.callback('❌ No', 'button_no'),
        ],
        [Markup.button.callback('❌ Cancel Broadcast', 'cancel_broadcast')],
      ]),
    });
  }

  @Action('button_yes')
  async onButtonYes(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getSession(userId);
    state.step = 'collect_button_text';

    await ctx.editMessageText(
      '🔤 *Enter the text for the button:*\n\nWhat should the button say?',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'cancel_broadcast')]]),
      },
    );
  }

  @Action('button_no')
  async onButtonNo(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getSession(userId);
    state.step = 'confirmation';

    await ctx.deleteMessage();
    await this.showConfirmation(ctx, state.message);
  }

  @Action('confirm_broadcast')
  async onConfirmBroadcast(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getSession(userId);
    state.message.pin = false;

    await ctx.editMessageText(
      '📡 *Broadcasting message...*\n\nSending your announcement to the selected groups.',
      {
        parse_mode: 'Markdown',
      },
    );

    try {
      const result = await this.broadcastMessage(state.message, ctx);

      if (result.success) {
        await ctx.reply(
          `✅ *Success!*\n\nYour message has been broadcasted to ${result.groupCount} groups.`,
          {
            parse_mode: 'Markdown',
          },
        );
      } else {
        // Create a more detailed error message
        let errorMessage = `⚠️ *Broadcast Failed*\n\n${result.message}`;

        // Keep this brief for user display
        if (result.failedGroups && result.failedGroups.length > 0) {
          errorMessage += `\n\nFailed groups: ${result.failedGroups.join(', ')}`;
        }

        await ctx.reply(errorMessage, {
          parse_mode: 'Markdown',
        });
      }
    } catch (error: unknown) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      console.error('Broadcast error:', errorMessage);
      await ctx.reply(
        '❌ *Error*\n\nThere was a problem broadcasting your message. Please try again later.',
        {
          parse_mode: 'Markdown',
        },
      );
    }

    state.step = 'completed';

    // Show the main keyboard again
    await this.showMainKeyboardAfterInlineQuery(ctx);
  }

  @Action('confirm_broadcast_pin')
  async onConfirmBroadcastPin(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getSession(userId);
    state.message.pin = true;

    await ctx.editMessageText(
      '📡 *Broadcasting message with pin...*\n\nSending and pinning your announcement in the selected groups.',
      {
        parse_mode: 'Markdown',
      },
    );

    try {
      const result = await this.broadcastMessage(state.message, ctx);

      if (result.success) {
        await ctx.reply(
          `✅ *Success!*\n\nYour message has been broadcasted and pinned in ${result.groupCount} groups.`,
          {
            parse_mode: 'Markdown',
          },
        );
      } else {
        // Create a more detailed error message
        let errorMessage = `⚠️ *Broadcast Failed*\n\n${result.message}`;

        // Keep this brief for user display
        if (result.failedGroups && result.failedGroups.length > 0) {
          errorMessage += `\n\nFailed groups: ${result.failedGroups.join(', ')}`;
        }

        await ctx.reply(errorMessage, {
          parse_mode: 'Markdown',
        });
      }
    } catch (error) {
      console.error('Broadcast error:', error);
      await ctx.reply(
        '❌ *Error*\n\nThere was a problem broadcasting your message. Please try again later.',
        {
          parse_mode: 'Markdown',
        },
      );
    }

    state.step = 'completed';

    // Show the main keyboard again
    await this.showMainKeyboardAfterInlineQuery(ctx);
  }

  @Action('cancel_broadcast')
  async onCancelBroadcast(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery('Broadcast canceled');
    this.resetState(userId);

    await ctx.editMessageText('❌ *Broadcast canceled*\n\nYour broadcast has been canceled.', {
      parse_mode: 'Markdown',
    });

    // Show the main keyboard again
    await this.showMainKeyboardAfterInlineQuery(ctx);
  }

  // Additional handlers for command interactions

  @Command('broadcast')
  async onBroadcastCommand(@Ctx() ctx: Context) {
    await this.onBroadcast(ctx);
  }

  @Command('cancel')
  async onCancelCommand(@Ctx() ctx: Context) {
    await this.handleCancel(ctx);
  }

  @Command('help')
  async onHelpCommand(@Ctx() ctx: Context) {
    try {
      // Try to edit the message if it's a callback query context
      if (ctx.updateType === 'callback_query') {
        await ctx.editMessageText(helpMessage, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Back', 'back_to_start')]]),
        });
      } else {
        // Otherwise send a new message
        await ctx.reply(helpMessage, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('🔙 Back', 'back_to_start')]]),
        });
      }
    } catch (error) {
      console.error('Error in help command:', error);
      await ctx.reply("Sorry, I couldn't display the help right now. Please try again later.");
    }
  }
}
