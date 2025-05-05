import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { WelcomeFlowModule } from './welcome-flow/welcome-flow.module';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN || (() => { throw new Error('TELEGRAM_BOT_TOKEN is not defined'); })(),
    }),
    WelcomeFlowModule,
  ],

})
export class AppModule {}