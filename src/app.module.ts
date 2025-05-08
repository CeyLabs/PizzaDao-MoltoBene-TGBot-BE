import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import * as dotenv from 'dotenv';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BroadcastFlowModule } from './broadcast-flow/broadcast-flow.module';
import { BotCommandsService } from './bot-commands';
import { PrivateChatMiddleware } from './middleware/chat-type.middleware';
import { BroadcastFlowUpdate } from './broadcast-flow/broadcast-flow.update';
import { KnexModule } from './modules/knex/knex.module';

dotenv.config();

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN || '',
      include: [BroadcastFlowModule, BroadcastFlowUpdate, BotCommandsService],
      middlewares: [new PrivateChatMiddleware().use()],
    }),
    BroadcastFlowModule,
    KnexModule,
  ],
  controllers: [AppController],
  providers: [AppService, BotCommandsService],
})
export class AppModule {}
