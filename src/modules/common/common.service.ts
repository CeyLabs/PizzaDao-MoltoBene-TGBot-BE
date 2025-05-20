import { Context } from 'telegraf';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Help, On, Update } from 'nestjs-telegraf';
import { WelcomeService } from '../welcome/welcome.service';
import { BroadcastService } from '../broadcast/broadcast.service';
import { UserFlow, UserState } from './common.interface';

@Update()
@Injectable()
export class CommonService {
  private userState = new Map<number, UserState>();

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
      // Ensure state has required properties for broadcast
      const broadcastState = {
        messages: state.messages ?? [],
        step: typeof state.step === 'string' ? state.step : '',
      };
      await this.broadcastService.handleBroadcastMessage(ctx, broadcastState);
    } else if (state.flow === 'welcome') {
      await this.welcomeService.handlePrivateChat(ctx);
    } else {
      // Default: maybe start welcome flow or ignore
      await this.welcomeService.handlePrivateChat(ctx);
    }
  }

  setUserState(userId: number, state: Partial<UserState>) {
    const prev = this.userState.get(userId) || { flow: 'idle' as UserFlow };
    const merged = { ...prev, ...state };
    if (!merged.flow) {
      merged.flow = 'idle';
    }
    this.userState.set(userId, merged as UserState);
  }

  getUserState(userId: number): UserState | undefined {
    return this.userState.get(userId);
  }

  clearUserState(userId: number) {
    this.userState.delete(userId);
  }
}
