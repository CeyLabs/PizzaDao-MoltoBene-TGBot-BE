/**
 * @fileoverview Controller for handling welcome-related Telegram bot commands and events
 * @module welcome.controller
 */

import { Controller } from '@nestjs/common';
import { Context } from 'telegraf';
import { WelcomeService } from './welcome.service';

/**
 * Controller class that handles all welcome-related bot interactions
 * @class WelcomeController
 * @description Manages user commands and events related to the welcome flow,
 * including start command, profile management, and user registration
 */
@Controller()
export class WelcomeController {
  constructor(private readonly welcomeService: WelcomeService) {}

  /**
   * Handles the /start command from users
   * @param {Context} ctx - The Telegraf context object
   * @returns {Promise<void>}
   */
  async startCommand(ctx: Context): Promise<void> {
    await this.welcomeService.handleStartCommand(ctx);
  }

  /**
   * Handles the /profile command from users
   * @param {Context} ctx - The Telegraf context object
   * @returns {Promise<void>}
   */
  async handleProfileCommand(ctx: Context): Promise<void> {
    await this.welcomeService.handleProfile(ctx);
  }

  /**
   * Handles new user registration process
   * @param {Context} ctx - The Telegraf context object
   * @returns {Promise<void>}
   */
  async handleUserRegistration(ctx: Context): Promise<void> {
    await this.welcomeService.handleUserRegistration(ctx);
  }

  /**
   * Handles new member join events in groups
   * @param {Context} ctx - The Telegraf context object
   * @returns {Promise<void>}
   */
  async handleNewMember(ctx: Context): Promise<void> {
    await this.welcomeService.handleNewMember(ctx);
  }

  /**
   * Handles callback queries from inline keyboards
   * @param {Context} ctx - The Telegraf context object
   * @returns {Promise<void>}
   */
  async handleCallbackQuery(ctx: Context): Promise<void> {
    await this.welcomeService.handleCallbackQuery(ctx);
  }

  /**
   * Handles private chat messages
   * @param {Context} ctx - The Telegraf context object
   * @returns {Promise<void>}
   */
  async handlePrivateChat(ctx: Context): Promise<void> {
    await this.welcomeService.handlePrivateChat(ctx);
  }

  /**
   * Handles member leave events in groups
   * @param {Context} ctx - The Telegraf context object
   * @returns {Promise<void>}
   */
  async handleLeftChatMember(ctx: Context): Promise<void> {
    await this.welcomeService.handleLeftChatMember(ctx);
  }
}
