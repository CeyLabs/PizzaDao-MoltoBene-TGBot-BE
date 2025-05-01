import { Injectable } from '@nestjs/common';
import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { BroadcastFlowService } from './broadcast-flow.service';
import { BroadcastMessage } from './interfaces/broadcast-message.interface';
import { BroadcastState } from './interfaces/broadcast-state.interface';

@Update()
@Injectable()
export class BroadcastFlowUpdate {
  private readonly userStates: Map<number, BroadcastState> = new Map();

  constructor(private readonly broadcastFlowService: BroadcastFlowService) {}

  private getState(userId: number): BroadcastState {
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

  private resetState(userId: number): void {
    this.userStates.set(userId, {
      step: 'idle',
      message: {
        scope: 'all',
        content: '',
      },
    });
  }

  private showMainKeyboard(ctx: Context) {
    return ctx.reply(
      'Choose an option:',
      Markup.keyboard([['Broadcast Message']]).resize(),
    );
  }

  private async showMainKeyboardAfterInlineQuery(ctx: any) {
    try {
      // For inline query responses, we need to ensure we're sending a new message
      await ctx.reply(
        'Choose an option:',
        Markup.keyboard([['Broadcast Message']]).resize(),
      );
    } catch (error) {
      console.error('Error showing main keyboard:', error);
    }
  }

  @Hears('Broadcast Message')
  async onBroadcast(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const state = this.getState(userId);
    state.step = 'select_scope';

    await ctx.reply(
      'Select broadcast target:',
      Markup.inlineKeyboard([
        Markup.button.callback('All Groups', 'scope_all'),
        Markup.button.callback('City', 'scope_city'),
      ]),
    );
  }

  @Action(/^scope_(.+)$/)
  async onScopeSelect(@Ctx() ctx: any) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getState(userId);
    const scopeMatch = ctx.match[1];

    if (scopeMatch === 'all') {
      state.message.scope = 'all';
      state.step = 'collect_message';
      await ctx.editMessageText(
        "Broadcasting to all groups. Now, let's collect message details.",
      );
      await this.promptForMessageContent(ctx);
    } else if (scopeMatch === 'city') {
      state.message.scope = 'city';
      state.step = 'select_city';

      const cities = this.broadcastFlowService.getAllCities();
      const cityButtons = cities.map((city) => [
        Markup.button.callback(city, `city_${city}`),
      ]);

      await ctx.editMessageText(
        'Select a city:',
        Markup.inlineKeyboard(cityButtons),
      );
    }
  }

  @Action(/^city_(.+)$/)
  async onCitySelect(@Ctx() ctx: any) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getState(userId);
    state.message.city = ctx.match[1];
    state.step = 'collect_message';

    await ctx.editMessageText(
      `Selected city: ${state.message.city}. Now, let's collect message details.`,
    );
    await this.promptForMessageContent(ctx);
  }

  private async promptForMessageContent(ctx: any) {
    await ctx.reply('Please enter the message content (required):');
  }

  @On('text')
  async onText(@Ctx() ctx: any) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const state = this.getState(userId);
    const text = ctx.message.text;

    // Skip processing if the text is a command
    if (text.startsWith('/')) {
      return;
    }

    // If the text is "Broadcast Message" and we're not in an active flow, start the flow
    if (
      text === 'Broadcast Message' &&
      (state.step === 'idle' || state.step === 'completed')
    ) {
      await this.onBroadcast(ctx);
      return;
    }

    // Process other text messages based on current step
    switch (state.step) {
      case 'collect_message':
        state.message.content = text;
        state.step = 'collect_place';
        await ctx.reply('Enter venue/place (optional, type "skip" to skip):');
        break;

      case 'collect_place':
        if (text.toLowerCase() !== 'skip') {
          state.message.place = text;
        }
        state.step = 'collect_date';
        await ctx.reply('Enter date (optional, type "skip" to skip):');
        break;

      case 'collect_date':
        if (text.toLowerCase() !== 'skip') {
          state.message.date = text;
        }
        state.step = 'collect_time';
        await ctx.reply('Enter time (optional, type "skip" to skip):');
        break;

      case 'collect_time':
        if (text.toLowerCase() !== 'skip') {
          state.message.time = text;
        }
        state.step = 'collect_links';
        await ctx.reply(
          'Enter external links (optional, type "skip" to skip):',
        );
        break;

      case 'collect_links':
        if (text.toLowerCase() !== 'skip') {
          state.message.externalLinks = text;
        }
        state.step = 'ask_image';

        await ctx.reply(
          'Would you like to add an image to this message?',
          Markup.inlineKeyboard([
            Markup.button.callback('Yes', 'image_yes'),
            Markup.button.callback('No', 'image_no'),
          ]),
        );
        break;

      case 'collect_button_text':
        state.message.buttonText = text;
        state.step = 'collect_button_url';
        await ctx.reply('Enter the URL for the button:');
        break;

      case 'collect_button_url':
        // Simple URL validation
        if (!text.startsWith('http://') && !text.startsWith('https://')) {
          await ctx.reply(
            'Please enter a valid URL starting with http:// or https://',
          );
          return;
        }

        state.message.buttonUrl = text;
        state.step = 'confirmation';
        await this.showConfirmation(ctx, state.message);
        break;

      default:
        // If not in a defined step, show the main keyboard
        if (text !== 'Broadcast Message') {
          await this.showMainKeyboard(ctx);
        }
        break;
    }
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: any) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const state = this.getState(userId);

    if (state.step === 'collect_image') {
      // Get the file ID of the highest resolution photo
      const photoFileId =
        ctx.message.photo[ctx.message.photo.length - 1].file_id;
      state.message.image = photoFileId;
      state.step = 'ask_button';

      await ctx.reply(
        'Would you like to include a button?',
        Markup.inlineKeyboard([
          Markup.button.callback('Yes', 'button_yes'),
          Markup.button.callback('No', 'button_no'),
        ]),
      );
    } else {
      // If user sends a photo when not asked for one, show the main keyboard
      await this.showMainKeyboard(ctx);
    }
  }

  @Action('image_yes')
  async onImageYes(@Ctx() ctx: any) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getState(userId);
    state.step = 'collect_image';

    await ctx.editMessageText('Please send an image for the broadcast:');
  }

  @Action('image_no')
  async onImageNo(@Ctx() ctx: any) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getState(userId);
    state.step = 'ask_button';

    await ctx.editMessageText(
      'Would you like to include a button?',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes', 'button_yes'),
        Markup.button.callback('No', 'button_no'),
      ]),
    );
  }

  @Action('button_yes')
  async onButtonYes(@Ctx() ctx: any) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getState(userId);
    state.step = 'collect_button_text';

    await ctx.editMessageText('Enter the text for the button:');
  }

  @Action('button_no')
  async onButtonNo(@Ctx() ctx: any) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getState(userId);
    state.step = 'confirmation';

    await this.showConfirmation(ctx, state.message);
  }

  private async showConfirmation(ctx: any, message: BroadcastMessage) {
    // Build message preview
    let previewText = '📢 *Preview:*\n\n';

    if (message.city) {
      previewText += `📍 *${message.city}*\n`;
    }

    previewText += message.content;

    if (message.place) {
      previewText += `\n🏢 Venue: ${message.place}`;
    }

    if (message.date) {
      previewText += `\n📅 Date: ${message.date}`;
    }

    if (message.time) {
      previewText += `\n⏰ Time: ${message.time}`;
    }

    if (message.externalLinks) {
      previewText += `\n🔗 Links: ${message.externalLinks}`;
    }

    if (message.buttonText && message.buttonUrl) {
      previewText += `\n\n🔘 Button: [${message.buttonText}](${message.buttonUrl})`;
    }

    previewText += '\n\n*Target:* ';
    previewText +=
      message.scope === 'all' ? 'All Groups' : `City - ${message.city}`;

    // Send the preview with confirmation buttons
    await ctx.reply(previewText, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('Broadcast', 'confirm_broadcast'),
          Markup.button.callback('Broadcast with Pin', 'confirm_broadcast_pin'),
        ],
        [Markup.button.callback('Cancel', 'cancel_broadcast')],
      ]),
    });
  }

  @Action('confirm_broadcast')
  async onConfirmBroadcast(@Ctx() ctx: any) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getState(userId);
    state.message.pin = false;

    await ctx.editMessageText('Broadcasting message...');
    await this.broadcastFlowService.broadcastMessage(state.message, ctx);

    state.step = 'completed';

    // Show the main keyboard again
    await this.showMainKeyboardAfterInlineQuery(ctx);
  }

  @Action('confirm_broadcast_pin')
  async onConfirmBroadcastPin(@Ctx() ctx: any) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();

    const state = this.getState(userId);
    state.message.pin = true;

    await ctx.editMessageText('Broadcasting message with pin...');
    await this.broadcastFlowService.broadcastMessage(state.message, ctx);

    state.step = 'completed';

    // Show the main keyboard again
    await this.showMainKeyboardAfterInlineQuery(ctx);
  }

  @Action('cancel_broadcast')
  async onCancelBroadcast(@Ctx() ctx: any) {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.answerCbQuery();
    this.resetState(userId);

    await ctx.editMessageText('Broadcast canceled.');

    // Show the main keyboard again
    await this.showMainKeyboardAfterInlineQuery(ctx);
  }

  // Handle command interactions
  @Command('broadcast')
  async onBroadcastCommand(@Ctx() ctx: Context) {
    await this.onBroadcast(ctx);
  }

  @Start()
  async onStartCommand(@Ctx() ctx: Context) {
    // Reset user state
    const userId = ctx.from?.id;
    if (userId) {
      this.resetState(userId);
    }

    // Reply with the main keyboard directly using Markup
    await ctx.reply(
      'Welcome to the Broadcasting Bot!',
      Markup.keyboard([['Broadcast Message']]).resize(),
    );
  }

  @Command('help')
  async onHelpCommand(@Ctx() ctx: Context) {
    await ctx.reply(
      'This bot allows you to broadcast messages to Telegram groups.\n\n' +
        'Available commands:\n' +
        '/start - Start the bot\n' +
        '/broadcast - Start a new broadcast\n' +
        '/help - Show this help message',
    );
    await this.showMainKeyboard(ctx);
  }

  // Fallback handler for any unhandled updates
  @On('message')
  async onAnyMessage(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const state = this.getState(userId);

    // Only show the keyboard if we're not in the middle of a flow
    if (state.step === 'idle' || state.step === 'completed') {
      await this.showMainKeyboard(ctx);
    }
  }
}
