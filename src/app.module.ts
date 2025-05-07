import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import * as dotenv from 'dotenv';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KnexModule } from './modules/knex/knex.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
