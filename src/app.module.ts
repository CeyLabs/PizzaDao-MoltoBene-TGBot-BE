import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { AppService } from './app.service';
import { KnexModule } from './modules/knex/knex.module';
import { WelcomeModule } from './modules/welcome/welcome.module';
import { UsersModule } from './modules/users/users.module';
import { CountryModule } from './modules/country/country.module';
import { CityModule } from './modules/city/city.module';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    TelegrafModule.forRoot({
      token:
        process.env.TELEGRAM_BOT_TOKEN ||
        (() => {
          throw new Error('TELEGRAM_BOT_TOKEN is not defined');
        })(),
    }),
    KnexModule,
    UsersModule,
    WelcomeModule,
    CountryModule,
    CityModule,
  ],
  providers: [AppService],
})
export class AppModule {}
