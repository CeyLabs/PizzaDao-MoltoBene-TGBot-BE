// src/app.module.ts
import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BroadcastFlowModule } from './broadcast-flow/broadcast-flow.module';
import { config, validateConfig } from './config/config';
import { BotCommandsService } from './bot-commands';

// Validate the configuration
validateConfig();

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: config.telegramToken,
      // Include the BroadcastFlowModule in the Telegraf module
      include: [BroadcastFlowModule],
    }),
    BroadcastFlowModule,
  ],
  controllers: [AppController],
  providers: [AppService, BotCommandsService],
})
export class AppModule {}
