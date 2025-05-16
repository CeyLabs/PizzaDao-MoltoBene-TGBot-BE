import { Injectable } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { CityService } from '../city/city.service';
import { UserService } from '../user/user.service';
import { Command, Ctx, InjectBot } from 'nestjs-telegraf';

@Injectable()
export class BroadcastService {
  constructor(
    @InjectBot() private bot: Telegraf<Context>,
    private readonly cityService: CityService,
    private readonly userService: UserService,
  ) {}

  @Command('broadcast')
  async onBroadcast(@Ctx() ctx: Context) {
    // send a greeting message
    await ctx.reply('Welcome to the broadcast flow!');
  }
}
