import { Injectable, Logger } from '@nestjs/common';
import { Command, Help, On, Start, Update, Action } from 'nestjs-telegraf';
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

  @Action('create_post')
  async handleCreatePost(ctx: Context) {
    this.logger.log('Create post action received');
    await this.broadcastService.onCreatePost(ctx);
  }

  @Command('profile')
  async handleProfileCommand(ctx: Context) {
    this.logger.log('Profile command received');
    await this.welcomeService.handleProfile(ctx);
  }

  @Command('register')
  async handleRegisterCommand(ctx: Context) {
    this.logger.log('Register command received');
    await this.welcomeService.handleUserRegistration(ctx);
  }

  @Help()
  async handleHelpCommand(ctx: Context) {
    await ctx.replyWithMarkdownV2(
      'ℹ️ *Help Menu*\n\n' +
        'Here are the commands you can use:\n\n' +
        '1\\. `/register` \\- Start the registration process\\.\n' +
        '2\\. `/profile` \\- View your profile information\\.\n' +
        '3\\. `/broadcast` \\- Broadcast messages to communities\\.\n' +
        '4\\. `/help` \\- Show this help menu\\.\n\n' +
        'If you have any questions or need further assistance, feel free to reach out\\!',
    );
  }

  @On('text')
  async handlePrivateChat(ctx: Context) {
    await this.welcomeService.handlePrivateChat(ctx);
  }
}
