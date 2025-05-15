import { Injectable, Logger } from '@nestjs/common';
import { On, Start, Update, Command } from 'nestjs-telegraf';
import { WelcomeService } from '../welcome/welcome.service';
import { Context } from 'telegraf';
import { BroadcastFlowService } from '../broadcast-flow/broadcast-flow.service';

@Update()
@Injectable()
export class CommonService {
  private readonly logger = new Logger(CommonService.name);

  constructor(
    private readonly welcomeService: WelcomeService,
    private readonly broadcastFlowService: BroadcastFlowService,
  ) {}

  @Start()
  async handleStart(ctx: Context) {
    this.logger.log('Start command received');

    // Check if this is a start command with a specific registration payload
    const startPayload =
      ctx.message && 'text' in ctx.message ? ctx.message.text.split(' ')[1] : null;

    if (startPayload && startPayload.startsWith('register_')) {
      // This is a registration flow, delegate to WelcomeService
      this.logger.log('Delegating to WelcomeService (registration flow)');
      await this.welcomeService.handleStartCommand(ctx);
    } else {
      // New user or returning user, start the welcome flow
      this.logger.log('Delegating to WelcomeService (regular flow)');
      await this.welcomeService.handleStartCommand(ctx);
    }
  }

  @Command('broadcast')
  async handleBroadcastCommand(ctx: Context) {
    this.logger.log('Broadcast command received');
    await this.broadcastFlowService.onBroadcast(ctx);
  }

  @Command(['help', 'h'])
  async handleHelpCommand(ctx: Context) {
    this.logger.log('Help command received');
    await this.broadcastFlowService.showHelp(ctx);
  }

  @Command('profile')
  async handleProfileCommand(ctx: Context) {
    this.logger.log('Profile command received');
    await this.welcomeService.handleProfile(ctx);
  }

  @Command('register')
  async handleRegisterCommand(ctx: Context) {
    this.logger.log('Register command received');
    await this.welcomeService.handleUserRegistration(ctx);
  }

  @Command('cityselect')
  async handleCitySelectCommand(ctx: Context) {
    this.logger.log('City select command received');
    if (!ctx.from?.id || !ctx.message || !('text' in ctx.message)) return;

    const selectedCity = ctx.message.text.split(' ').slice(1).join(' ').trim();
    this.logger.log(`Selected city from command: ${selectedCity}`);

    if (!selectedCity) {
      await ctx.reply('Please provide a city name after /cityselect command.');
      return;
    }

    // Get user state and ensure we're in the right broadcast flow
    const userId = ctx.from.id;
    const state = this.broadcastFlowService.getSession(userId);

    // Force the state to be in city selection mode if it isn't already
    if (state.step !== 'select_city') {
      state.step = 'select_city';
      state.message.scope = 'city';
    }

    this.logger.log(`User state before city selection: ${JSON.stringify(state)}`);

    // Now handle the city selection
    await this.broadcastFlowService.handleCitySelection(ctx, selectedCity);
  }

  @On('text')
  async handleText(ctx: Context) {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const userId = ctx.from?.id;

    if (!userId) return;

    this.logger.log(`Text message received from user ${userId}: ${text}`);

    // Check if this is a private chat
    const isPrivateChat = ctx.chat?.type === 'private';

    if (isPrivateChat) {
      // Check if it's a /cityselect command first
      if (text.startsWith('/cityselect')) {
        await this.handleCitySelectCommand(ctx);
        return;
      }

      // Check if we're in broadcast state
      const broadcastState = this.broadcastFlowService.getSession(userId);

      // Debug log the current state
      this.logger.log(`User ${userId} current state: ${JSON.stringify(broadcastState)}`);

      if (broadcastState && broadcastState.step !== 'idle' && broadcastState.step !== 'completed') {
        // We're in an active broadcast flow, delegate to BroadcastFlowService
        this.logger.log(`User ${userId} is in broadcast flow step: ${broadcastState.step}`);
        await this.broadcastFlowService.onText(ctx);
        return;
      }

      // If not in a broadcast flow, handle through WelcomeService
      await this.welcomeService.handlePrivateChat(ctx);
    } else {
      // For group chats, let the broadcast service handle text if applicable
      await this.broadcastFlowService.onText(ctx);
    }
  }

  @On('callback_query')
  async handleCallbackQuery(ctx: Context) {
    const callbackData =
      ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;

    if (!callbackData) return;

    this.logger.log(`Callback query received: ${callbackData}`);

    // First, handle some specific callback patterns that require special handling
    if (callbackData.startsWith('city_')) {
      // For city select callbacks that use RegExp patterns
      const cityId = callbackData.split('_')[1];
      const customCtx = ctx as Context & { match: RegExpExecArray };
      customCtx.match = ['city_' + cityId, cityId] as unknown as RegExpExecArray;

      this.logger.log(`Handling city selection: ${cityId}`);
      await this.broadcastFlowService.onCitySelect(customCtx);
      return;
    }

    if (callbackData.startsWith('scope_')) {
      // For scope select callbacks that use RegExp patterns
      const scope = callbackData.split('_')[1];
      const customCtx = ctx as Context & { match: RegExpExecArray };
      customCtx.match = ['scope_' + scope, scope] as unknown as RegExpExecArray;

      this.logger.log(`Handling scope selection: ${scope}`);
      await this.broadcastFlowService.onScopeSelect(customCtx);
      return;
    }

    // Then handle specific callback actions
    switch (callbackData) {
      // Broadcast flow callbacks
      case 'start_broadcast':
        await this.broadcastFlowService.onStartBroadcast(ctx);
        break;
      case 'cancel_broadcast':
        await this.broadcastFlowService.onCancelBroadcast(ctx);
        break;
      case 'back_from_city':
        await this.broadcastFlowService.onBackFromCity(ctx);
        break;
      case 'back_to_start':
        await this.broadcastFlowService.onBackToStart(ctx);
        break;
      case 'show_help':
        await this.broadcastFlowService.showHelp(ctx);
        break;
      case 'skip_place':
        await this.broadcastFlowService.onSkipPlace(ctx);
        break;
      case 'skip_date':
        await this.broadcastFlowService.onSkipDate(ctx);
        break;
      case 'skip_time':
        await this.broadcastFlowService.onSkipTime(ctx);
        break;
      case 'skip_links':
        await this.broadcastFlowService.onSkipLinks(ctx);
        break;
      case 'image_yes':
        await this.broadcastFlowService.onImageYes(ctx);
        break;
      case 'image_no':
        await this.broadcastFlowService.onImageNo(ctx);
        break;
      case 'button_yes':
        await this.broadcastFlowService.onButtonYes(ctx);
        break;
      case 'button_no':
        await this.broadcastFlowService.onButtonNo(ctx);
        break;
      case 'confirm_broadcast':
        await this.broadcastFlowService.onConfirmBroadcast(ctx);
        break;
      case 'confirm_broadcast_pin':
        await this.broadcastFlowService.onConfirmBroadcastPin(ctx);
        break;

      // Welcome flow callbacks - all others go to the welcome service
      default:
        if (
          callbackData.startsWith('confirm_register_') ||
          callbackData === 'cancel_register' ||
          callbackData === 'explore_cities' ||
          callbackData.startsWith('region_') ||
          callbackData.startsWith('country_') ||
          callbackData === 'back_to_region' ||
          callbackData === 'back_to_country' ||
          callbackData === 'refresh_profile' ||
          callbackData.startsWith('edit_') ||
          callbackData === 'has_pizza_name' ||
          callbackData === 'give_me_pizza_name' ||
          callbackData.startsWith('ninja_')
        ) {
          await this.welcomeService.handleCallbackQuery(ctx);
        } else {
          this.logger.warn(`Unhandled callback query: ${callbackData}`);
        }
        break;
    }
  }

  @On('new_chat_members')
  async handleNewMembers(ctx: Context) {
    await this.welcomeService.handleNewMember(ctx);
  }

  @On('left_chat_member')
  async handleLeftMember(ctx: Context) {
    await this.welcomeService.handleLeftChatMember(ctx);
  }

  @On('photo')
  async handlePhoto(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    // Check if we're in the broadcast flow
    const broadcastState = this.broadcastFlowService.getSession(userId);
    if (broadcastState && broadcastState.step === 'collect_image') {
      await this.broadcastFlowService.onPhoto(ctx);
    }
  }

  @On('inline_query')
  async handleInlineQuery(ctx: Context) {
    this.logger.log('Inline query received');
    await this.broadcastFlowService.handleInlineQuery(ctx);
  }
}
