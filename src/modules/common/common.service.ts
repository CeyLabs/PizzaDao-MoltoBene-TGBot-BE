/**
 * @fileoverview Service for managing common functionality across the application
 * @module common.service
 */

import RunCache from 'run-cache';
import { Context } from 'telegraf';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Help, On, Update } from 'nestjs-telegraf';
import { WelcomeService } from '../welcome/welcome.service';
import { BroadcastService } from '../broadcast/broadcast.service';
import { TUserFlow, IUserState } from './common.interface';
import { getContextTelegramUserId } from 'src/utils/context';

/**
 * Service for managing common functionality and user state
 * @class CommonService
 * @description Handles common operations across the application, including
 * user state management, help commands, and message routing
 */
@Update()
@Injectable()
export class CommonService {
  /** Cache key prefix for user state */
  private readonly USER_STATE_PREFIX = 'user_state:';

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
    const userId = getContextTelegramUserId(ctx);
    if (!userId) return;

    const state = (await this.getUserState(Number(userId))) || { flow: 'idle' as TUserFlow };

    if (state.flow === 'broadcast') {
      await this.broadcastService.handleBroadcatsMessages(ctx);
    } else if (state.flow === 'welcome') {
      await this.welcomeService.handlePrivateChat(ctx);
    } else {
      await this.welcomeService.handlePrivateChat(ctx);
    }
  }

  /**
   * Generates a cache key for user state
   * @param {number} userId - The user's Telegram ID
   * @returns {string} The cache key
   * @private
   */
  private getUserStateCacheKey(userId: number): string {
    return `${this.USER_STATE_PREFIX}${userId}`;
  }

  /**
   * Sets or updates a user's state
   * @param {number} userId - The user's Telegram ID
   * @param {Partial<IUserState>} state - The state to set or update
   */
  async setUserState(userId: number, state: Partial<IUserState>) {
    const cacheKey = this.getUserStateCacheKey(userId);
    const cachedUserState = await RunCache.get(cacheKey);

    let prev: IUserState = { flow: 'idle' as TUserFlow };

    if (cachedUserState) {
      prev = JSON.parse(cachedUserState as string) as IUserState;
    }

    const merged = { ...prev, ...state };
    if (!merged.flow) {
      merged.flow = 'idle';
    }
    await RunCache.set({ key: cacheKey, value: JSON.stringify(merged) });
  }

  /**
   * Gets a user's current state
   * @param {number} userId - The user's Telegram ID
   * @returns {IUserState | undefined} The user's state or undefined if not found
   */
  async getUserState(userId: number): Promise<IUserState | undefined> {
    const cacheKey = this.getUserStateCacheKey(userId);
    const cachedUserState = await RunCache.get(cacheKey);

    if (cachedUserState) {
      return JSON.parse(cachedUserState as string) as IUserState;
    }

    return undefined;
  }

  /**
   * Clears a user's state
   * @param {number} userId - The user's Telegram ID
   */
  async clearUserState(userId: number) {
    const cacheKey = this.getUserStateCacheKey(userId);
    await RunCache.delete(cacheKey);
  }
}
