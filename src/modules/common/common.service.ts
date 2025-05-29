/**
 * @fileoverview Service for managing common functionality across the application
 * @module common.service
 */

import { Context } from 'telegraf';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Help, On, Update } from 'nestjs-telegraf';
import { WelcomeService } from '../welcome/welcome.service';
import { BroadcastService } from '../broadcast/broadcast.service';
import { TUserFlow, IUserState } from './common.interface';

/**
 * Service for managing common functionality and user state
 * @class CommonService
 * @description Handles common operations across the application, including
 * user state management, help commands, and message routing
 */
@Update()
@Injectable()
export class CommonService {
  /** Map storing user states by user ID */
  private userState = new Map<number, IUserState>();

  constructor(
    @Inject(forwardRef(() => WelcomeService))
    private readonly welcomeService: WelcomeService,
    @Inject(forwardRef(() => BroadcastService))
    private readonly broadcastService: BroadcastService,
  ) {}

  /**
   * Handles the /help command
   * @param {Context} ctx - The Telegraf context
   * @returns {Promise<void>}
   */
  @Help()
  async handleHelpCommand(ctx: Context) {
    await ctx.replyWithMarkdownV2(
      'ℹ️ *Help Menu*\n\n' +
        'Here are the commands you can use:\n\n' +
        '1\\. `/register` \\- Start the registration process\\.\n' +
        '2\\. `/profile` \\- View your profile information\\.\n' +
        '3\\. `/broadcast` \\- Broadcast messages to communities\\.\n' +
        '4\\. `/help` \\- Show this help menu\\.\n\n' +
        'If you have any questions or need further assistance, feel free to reach out\\!',
    );
  }

  /**
   * Handles callback queries from inline keyboards
   * @param {Context} ctx - The Telegraf context
   * @returns {Promise<void>}
   */
  @On('callback_query')
  async handleCallbackQuery(ctx: Context) {
    await this.welcomeService.handleCallbackQuery(ctx);
    await this.broadcastService.handleCallbackQuery?.(ctx);
  }

  /**
   * Handles incoming messages and routes them to appropriate services
   * @param {Context} ctx - The Telegraf context
   * @returns {Promise<void>}
   */
  @On('message')
  async handleMessage(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const state = this.userState.get(userId) || { flow: 'idle' as TUserFlow };

    if (state.flow === 'broadcast') {
      await this.broadcastService.handleBroadcatsMessages(ctx);
    } else if (state.flow === 'welcome') {
      await this.welcomeService.handlePrivateChat(ctx);
    } else {
      await this.welcomeService.handlePrivateChat(ctx);
    }
  }

  /**
   * Sets or updates a user's state
   * @param {number} userId - The user's Telegram ID
   * @param {Partial<IUserState>} state - The state to set or update
   */
  setUserState(userId: number, state: Partial<IUserState>) {
    const prev = this.userState.get(userId) || { flow: 'idle' as TUserFlow };
    const merged = { ...prev, ...state };
    if (!merged.flow) {
      merged.flow = 'idle';
    }
    this.userState.set(userId, merged as IUserState);
  }

  /**
   * Gets a user's current state
   * @param {number} userId - The user's Telegram ID
   * @returns {IUserState | undefined} The user's state or undefined if not found
   */
  getUserState(userId: number): IUserState | undefined {
    return this.userState.get(userId);
  }

  /**
   * Clears a user's state
   * @param {number} userId - The user's Telegram ID
   */
  clearUserState(userId: number) {
    this.userState.delete(userId);
  }
}
