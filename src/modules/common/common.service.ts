import { Context } from 'telegraf';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Help, On, Update } from 'nestjs-telegraf';
import { WelcomeService } from '../welcome/welcome.service';
import { BroadcastService } from '../broadcast/broadcast.service';
import { UserFlow, IUserState } from './common.interface';

@Update()
@Injectable()
export class CommonService {
  private userState = new Map<number, IUserState>();

  constructor(
    @Inject(forwardRef(() => WelcomeService))
    private readonly welcomeService: WelcomeService,
    @Inject(forwardRef(() => BroadcastService))
    private readonly broadcastService: BroadcastService,
  ) {}

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

  @On('callback_query')
  async handleCallbackQuery(ctx: Context) {
    await this.welcomeService.handleCallbackQuery(ctx);
    await this.broadcastService.handleCallbackQuery?.(ctx);
  }

  @On('message')
  async handleMessage(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const state = this.userState.get(userId) || { flow: 'idle' };

    if (state.flow === 'broadcast') {
      await this.broadcastService.handleBroadcatsMessages(ctx);
    } else if (state.flow === 'welcome') {
      await this.welcomeService.handlePrivateChat(ctx);
    } else {
      await this.welcomeService.handlePrivateChat(ctx);
    }
  }

  setUserState(userId: number, state: Partial<IUserState>) {
    const prev = this.userState.get(userId) || { flow: 'idle' as UserFlow };
    const merged = { ...prev, ...state };
    if (!merged.flow) {
      merged.flow = 'idle';
    }
    this.userState.set(userId, merged as IUserState);
  }

  getUserState(userId: number): IUserState | undefined {
    return this.userState.get(userId);
  }

  clearUserState(userId: number) {
    this.userState.delete(userId);
  }
}
