import { Controller, Logger } from '@nestjs/common';
import { Action, Command, Ctx, Hears, On, Start, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { BroadcastFlowService } from './broadcast-flow.service';

import {
  InlineKeyboardButton,
  InlineQueryResultArticle,
} from 'telegraf/typings/core/types/typegram';
import { helpMessage, welcomeMessage } from 'src/bot-commands';

@Update()
@Controller()
export class BroadcastFlowController {
  constructor(private readonly broadcastFlowService: BroadcastFlowService) {}

  @Command('cityselect')
  async handleCitySelectCommand(@Ctx() ctx: Context) {
    if (!ctx.from?.id || !ctx.message || !('text' in ctx.message)) return;
    const selectedCity = ctx.message.text.split(' ').slice(1).join(' ').trim();
    await this.broadcastFlowService.handleCitySelection(ctx, selectedCity);
  }

  @Start()
  async onStartCommand(@Ctx() ctx: Context) {
    // Reset user state
    const userId: number | undefined = ctx.from?.id;
    if (userId) {
      this.broadcastFlowService.resetState(userId);
    }

    const firstName = ctx.from?.first_name || 'there';

    // Welcome message with emoji and formatting
    const personalizedWelcomeMessage = `
🎉 *Welcome, ${firstName}!* 🎉+

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

    // Also show the main keyboard
    await this.broadcastFlowService.showMainKeyboard(ctx);
  }

  @Hears(['🔊 Broadcast Message', 'Broadcast Message'])
  @Command('broadcast')
  async onBroadcast(@Ctx() ctx: Context) {
    const userId: number | undefined = ctx.from?.id;
    if (!userId) return;

    const state = this.broadcastFlowService.getSession(userId);
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
    const state = this.broadcastFlowService.getSession(userId);
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

    const state = this.broadcastFlowService.getSession(userId);
    const scopeMatch = Array.isArray((ctx as Context & { match: RegExpExecArray }).match)
      ? ((ctx as Context & { match: RegExpExecArray }).match[1] as string | undefined)
      : undefined;

    if (scopeMatch === 'all') {
      const isAdmin = await this.broadcastFlowService.validateCityAdmin(
        'MAIN_CITY_NAME',
        userId.toString(),
      ); // Replace 'MAIN_CITY_NAME' with the actual city name

      if (!isAdmin) {
        await ctx.reply('❌ You are not authorized to broadcast to all groups.');
        return;
      }

      state.message.scope = 'all';
      state.step = 'collect_message';
      await ctx.editMessageText(
        "🌎 *Broadcasting to all groups*\n\nNow, let's collect your message details.",
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([[Markup.button.callback('❌ Cancel', 'cancel_broadcast')]]),
        },
      );
      await this.broadcastFlowService.promptForMessageContent(ctx);
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

    const allCities = await this.broadcastFlowService.getAllCities();
    const filtered = query
      ? allCities.filter((city) => city.toLowerCase().includes(query))
      : allCities;

    // Import nanoid dynamically
    const { nanoid } = await import('nanoid');

    const results: InlineQueryResultArticle[] = filtered
      .slice(offset, offset + pageSize)
      .map((city) => ({
        type: 'article',
        id: nanoid(),
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
    const SUB_GROUP_ID = await this.broadcastFlowService.handleCitySelection(ctx, selectedCity);

    if (!SUB_GROUP_ID) {
      await ctx.reply('❌ Invalid city selected. Please try again.');
      return;
    }
  }

  // private async promptForMessageContent(ctx: any) {
  //   await this.showCancelOption(
  //     ctx,
  //     '✏️ *Please enter your message content:* (required)\n\nType your announcement message below.',
  //     { parse_mode: 'Markdown' },
  //   );
  // }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const state = this.broadcastFlowService.getSession(userId);
    const text =
      ctx.message && 'text' in ctx.message && typeof ctx.message.text === 'string'
        ? ctx.message.text
        : '';

    // Skip processing if the text is a command
    if (typeof text === 'string' && text.startsWith('/')) {
      if (text === '/cancel') {
        await this.broadcastFlowService.handleCancel(ctx);
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
        await this.broadcastFlowService.promptForPlace(ctx);
        break;

      case 'collect_place':
        if (typeof text === 'string' && text.toLowerCase() !== 'skip') {
          state.message.place = text;
        }
        state.step = 'collect_date';
        await this.broadcastFlowService.promptForDate(ctx);
        break;

      case 'collect_date':
        if (typeof text === 'string' && text.toLowerCase() !== 'skip') {
          state.message.date = text;
        }
        state.step = 'collect_time';
        await this.broadcastFlowService.promptForTime(ctx);
        break;

      case 'collect_time':
        if (typeof text === 'string' && text.toLowerCase() !== 'skip') {
          state.message.time = text;
        }
        state.step = 'collect_links';
        await this.broadcastFlowService.promptForLinks(ctx);
        break;

      case 'collect_links':
        if (typeof text === 'string' && text.toLowerCase() !== 'skip') {
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
        await this.broadcastFlowService.showCancelOption(
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
        await this.broadcastFlowService.showConfirmation(ctx, state.message);
        break;

      default:
        // If not in a defined step, show the main keyboard
        if (text !== '🔊 Broadcast Message' && text !== 'Broadcast Message') {
          // await this.broadcastFlowService.showMainKeyboard(ctx);
        }
        break;
    }
  }

  @Action('skip_place')
  async onSkipPlace(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery('Skipped venue/place');

    const state = this.broadcastFlowService.getSession(userId);
    state.step = 'collect_date';

    await ctx.deleteMessage();
    await this.broadcastFlowService.promptForDate(ctx);
  }

  @Action('skip_date')
  async onSkipDate(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery('Skipped date');

    const state = this.broadcastFlowService.getSession(userId);
    state.step = 'collect_time';

    await ctx.deleteMessage();
    await this.broadcastFlowService.promptForTime(ctx);
  }

  @Action('skip_time')
  async onSkipTime(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery('Skipped time');

    const state = this.broadcastFlowService.getSession(userId);
    state.step = 'collect_links';

    await ctx.deleteMessage();
    await this.broadcastFlowService.promptForLinks(ctx);
  }

  @Action('skip_links')
  async onSkipLinks(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery('Skipped external links');

    const state = this.broadcastFlowService.getSession(userId);
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

    const state = this.broadcastFlowService.getSession(userId);

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
      // If user sends a photo when not asked for one, show the main keyboard
      await this.broadcastFlowService.showMainKeyboard(ctx);
    }
  }

  @Action('image_yes')
  async onImageYes(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.broadcastFlowService.getSession(userId);
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

    const state = this.broadcastFlowService.getSession(userId);
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

    const state = this.broadcastFlowService.getSession(userId);
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

    const state = this.broadcastFlowService.getSession(userId);
    state.step = 'confirmation';

    await ctx.deleteMessage();
    await this.broadcastFlowService.showConfirmation(ctx, state.message);
  }

  @Action('confirm_broadcast')
  async onConfirmBroadcast(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.broadcastFlowService.getSession(userId);
    state.message.pin = false;

    await ctx.editMessageText(
      '📡 *Broadcasting message...*\n\nSending your announcement to the selected groups.',
      {
        parse_mode: 'Markdown',
      },
    );

    try {
      const result = await this.broadcastFlowService.broadcastMessage(state.message, ctx);

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
    await this.broadcastFlowService.showMainKeyboardAfterInlineQuery(ctx);
  }

  @Action('confirm_broadcast_pin')
  async onConfirmBroadcastPin(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.broadcastFlowService.getSession(userId);
    state.message.pin = true;

    await ctx.editMessageText(
      '📡 *Broadcasting message with pin...*\n\nSending and pinning your announcement in the selected groups.',
      {
        parse_mode: 'Markdown',
      },
    );

    try {
      const result = await this.broadcastFlowService.broadcastMessage(state.message, ctx);

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
    // await this.showMainKeyboardAfterInlineQuery(ctx);
  }

  @Action('cancel_broadcast')
  async onCancelBroadcast(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery('Broadcast canceled');
    this.broadcastFlowService.resetState(userId);

    await ctx.editMessageText('❌ *Broadcast canceled*\n\nYour broadcast has been canceled.', {
      parse_mode: 'Markdown',
    });

    // Show the main keyboard again
    // await this.showMainKeyboardAfterInlineQuery(ctx);
  }

  // Handle command interactions

  @Command('broadcast')
  async onBroadcastCommand(@Ctx() ctx: Context) {
    await this.onBroadcast(ctx);
  }

  @Command('cancel')
  async onCancelCommand(@Ctx() ctx: Context) {
    await this.broadcastFlowService.handleCancel(ctx);
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

  // Fallback handler for any unhandled updates
  @On('message')
  async onAnyMessage(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const state = this.broadcastFlowService.getSession(userId);

    // Only show the keyboard if we're not in the middle of a flow
    if (state.step === 'idle' || state.step === 'completed') {
      await this.broadcastFlowService.showMainKeyboard(ctx);
    }
  }
}
