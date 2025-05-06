import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { AppService } from './app.service';
import { KnexModule } from './modules/knex/knex.module';
import { WelcomeModule } from './modules/welcome/welcome.module';
import { GeneralModule } from './modules/general/general.module';
import { UsersModule } from './modules/users/users.module';
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
    GeneralModule,
    WelcomeModule,
  ],
  providers: [AppService],
})
export class AppModule {}
