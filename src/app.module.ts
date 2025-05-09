import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
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
          launchOptions: {
            webhook: {
              domain: configService.get<string>('WEBHOOK_DOMAIN') || '',
              path: '/webhook',
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    KnexModule,
    UserModule,
    WelcomeModule,
    CountryModule,
    CityModule,
  ],
  providers: [AppService],
})
export class AppModule {}
