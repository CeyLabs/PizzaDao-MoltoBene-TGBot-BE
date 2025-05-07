import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN || (() => { throw new Error('TELEGRAM_BOT_TOKEN is not defined'); })(),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
