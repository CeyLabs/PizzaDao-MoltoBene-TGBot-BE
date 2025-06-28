/**
 * @fileoverview Module providing the management Telegram bot
 * @module manager-bot.module
 */

import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ManagerBotService } from './manager-bot.service';
import { TenantModule } from '../tenant/tenant.module';
import { PrivateChatMiddleware } from '../../middleware/chat-type.middleware';

@Module({
  imports: [
    ConfigModule,
    TenantModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>('MANAGER_BOT_TOKEN');
        if (!token) {
          throw new Error('MANAGER_BOT_TOKEN is not defined');
        }
        return {
          token,
          botName: 'managerBot',
          launchOptions:
            process.env.ENABLE_WEBHOOK === 'true'
              ? {
                  webhook: {
                    domain: configService.get<string>('WEBHOOK_DOMAIN') || '',
                    path: '/manager/webhook',
                  },
                }
              : {},
          middlewares: [new PrivateChatMiddleware().use()],
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [ManagerBotService],
})
export class ManagerBotModule {}
