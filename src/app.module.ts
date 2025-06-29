/**
 * @fileoverview Root module of the PizzaDao MoltoBene Telegram Bot application
 * @module app.module
 */

import { Module, Type } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule } from '@nestjs/config';
import { config } from 'dotenv';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { KnexModule } from './modules/knex/knex.module';
import { WelcomeModule } from './modules/welcome/welcome.module';
import { UserModule } from './modules/user/user.module';
import { CountryModule } from './modules/country/country.module';
import { CityModule } from './modules/city/city.module';
import { CommonModule } from './modules/common/common.module';
import { PrivateChatMiddleware } from './middleware/chat-type.middleware';
import { BroadcastModule } from './modules/broadcast/broadcast.module';
import { EventDetailModule } from './modules/event-detail/event-detail.module';
import { ITenant } from './modules/tenant/tenant.interface';
import { TenantModule } from './modules/tenant/tenant.module';

// Load environment variables
config();

export function createAppModule(tenants: ITenant[]): Type<any> {
  const botModules = tenants.map((tenant) =>
    TelegrafModule.forRoot({
      token: tenant.bot_token,
      botName: tenant.name,
      launchOptions:
        process.env.ENABLE_WEBHOOK === 'true'
          ? {
              webhook: {
                domain: process.env.WEBHOOK_DOMAIN || '',
                path: '/webhook',
              },
            }
          : {},
      middlewares: [new PrivateChatMiddleware().use()],
    }),
  );

  @Module({
    imports: [
      ConfigModule.forRoot(),
      ...botModules,
      TenantModule,
      UserModule,
      WelcomeModule,
      BroadcastModule,
      CommonModule,
      KnexModule,
      CountryModule,
      CityModule,
      EventDetailModule,
    ],
    controllers: [AppController],
    providers: [AppService],
  })
  class AppModule {}

  return AppModule;
}
