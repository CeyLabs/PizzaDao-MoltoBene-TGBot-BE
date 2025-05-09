import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { BroadcastMessage, BroadcastResult, BroadcastState } from './broadcast-flow.interface';
import { CityService } from '../city/city.service';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class BroadcastFlowService {
  private readonly userStates: Map<number, BroadcastState> = new Map();
  private readonly logger = new Logger(BroadcastFlowService.name);

  constructor(
    @InjectBot() private bot: Telegraf<Context>,
    private readonly cityService: CityService,
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
  showMainKeyboard(ctx: Context) {
    return ctx.reply(
      '✨ What would you like to do today? ✨',
      // Markup.keyboard([['🔊 Broadcast Message']]).resize(),
    );
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
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'cancel_broadcast')]]),
      },
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

    // Show the main keyboard again
    await this.showMainKeyboard(ctx);
  }

  async getGroupsByCity(city: string): Promise<{ group_id: string; name: string }[]> {
    return this.cityService.getGroupsByCity(city);
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
        targetGroups = await this.cityService.getGroupsByCity(message.city);
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
}
