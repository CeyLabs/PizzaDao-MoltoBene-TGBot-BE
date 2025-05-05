import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BroadcastFlowModule } from './broadcast-flow/broadcast-flow.module';
import { config, validateConfig } from './config/config';
import { BotCommandsService } from './bot-commands';
import { PrivateChatMiddleware } from './middleware/chat-type.middleware';
import { BroadcastFlowUpdate } from './broadcast-flow/broadcast-flow.update';

// Validate the configuration
validateConfig();

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: config.telegramToken,
      include: [BroadcastFlowModule, BroadcastFlowUpdate, BotCommandsService],
      middlewares: [PrivateChatMiddleware],
    }),
    BroadcastFlowModule,
  ],
  controllers: [AppController],
  providers: [AppService, BotCommandsService],
})
export class AppModule {}
