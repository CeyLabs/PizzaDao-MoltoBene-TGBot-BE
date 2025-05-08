import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { AppService } from './app.service';
import { BroadcastFlowModule } from './modules/broadcast-flow/broadcast-flow.module';
import { BotCommandsService } from './bot-commands';
import { PrivateChatMiddleware } from './middleware/chat-type.middleware';
import { BroadcastFlowController } from './modules/broadcast-flow/broadcast-flow.controller';
import { KnexModule } from './modules/knex/knex.module';
import { WelcomeModule } from './modules/welcome/welcome.module';
import { UserModule } from './modules/user/user.module';
import { CountryModule } from './modules/country/country.module';
import { CityModule } from './modules/city/city.module';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN || '',
      include: [BroadcastFlowModule, BroadcastFlowController, BotCommandsService],
      middlewares: [new PrivateChatMiddleware().use()],
    }),
    BroadcastFlowModule,
    KnexModule,
    UserModule,
    WelcomeModule,
    CountryModule,
    CityModule,
  ],

  providers: [AppService, BotCommandsService],
})
export class AppModule {}
