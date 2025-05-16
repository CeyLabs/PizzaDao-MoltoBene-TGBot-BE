import { Injectable, Logger } from '@nestjs/common';
import { Command, On, Start, Update } from 'nestjs-telegraf';
import { WelcomeService } from '../welcome/welcome.service';
import { Context } from 'telegraf';
import { BroadcastService } from '../broadcast/broadcast.service';

@Update()
@Injectable()
export class CommonService {
  private readonly logger = new Logger(CommonService.name);
  constructor(
    private readonly welcomeService: WelcomeService,
    private readonly broadcastService: BroadcastService,
  ) {}

  @Start()
  async handleStart(ctx: Context) {
    this.logger.log('Start command received');
    await this.welcomeService.handleStartCommand(ctx);
  }

  @Command('broadcast')
  async handleBroadcast(ctx: Context) {
    await this.broadcastService.onBroadcast(ctx);
  }

  @On('text')
  async handlePrivateChat(ctx: Context) {
    await this.welcomeService.handlePrivateChat(ctx);
  }
}
