/**
 * @fileoverview Telegram bot service for management commands
 * @module manager-bot.service
 */

import { Injectable } from '@nestjs/common';
import { Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { TenantService } from '../tenant/tenant.service';

/**
 * Service handling management bot commands
 */
@Update({ botName: 'managerBot' })
@Injectable()
export class ManagerBotService {
  constructor(private readonly tenantService: TenantService) {}

  /**
   * Registers a new tenant
   * Usage: /register <name> <token> [username]
   */
  @Command('register')
  async registerCommand(@Ctx() ctx: Context) {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const [, name, token, username] = text.split(' ');

    if (!name || !token) {
      await ctx.reply('Usage: /register <name> <token> [username]');
      return;
    }

    try {
      await this.tenantService.createTenant(name, token, username);
      await ctx.reply(`Tenant ${name} registered.`);
    } catch {
      await ctx.reply('Failed to register tenant.');
    }
  }
}
