import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { BroadcastFlowModule } from './modules/broadcast-flow/broadcast-flow.module';
import { BotCommandsService } from './bot-commands';
import { PrivateChatMiddleware } from './middleware/chat-type.middleware';
import { BroadcastFlowController } from './modules/broadcast-flow/broadcast-flow.controller';
import { AppController } from './app.controller';
import { KnexModule } from './modules/knex/knex.module';
import { WelcomeModule } from './modules/welcome/welcome.module';
import { UserModule } from './modules/user/user.module';
import { CountryModule } from './modules/country/country.module';
import { CityModule } from './modules/city/city.module';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>('TELEGRAM_BOT_TOKEN');
        if (!token) {
          throw new Error('TELEGRAM_BOT_TOKEN is not defined in the environment variables');
        }
        return {
          token,
          launchOptions:
            process.env.ENABLE_WEBHOOK === 'true'
              ? {
                  webhook: {
                    domain: configService.get<string>('WEBHOOK_DOMAIN') || '',
                    path: '/webhook',
                  },
                }
              : {},
          middlewares: [new PrivateChatMiddleware().use()],
          include: [BroadcastFlowController],
        };
      },
      inject: [ConfigService],
    }),
    BroadcastFlowModule,
    KnexModule,
    UserModule,
    WelcomeModule,
    CountryModule,
    CityModule,
  ],

  providers: [AppService, AppController, BotCommandsService],
})
export class AppModule {}
