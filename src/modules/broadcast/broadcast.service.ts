import { Injectable, Logger } from '@nestjs/common';
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
    // get telegram chat username
    const user = ctx.from;
    const userId = ctx.from?.id;
    const username = user?.username;

    if (!userId) {
      await ctx.reply('User ID is undefined. Cannot determine user role.');
      return;
    }
    const userRole = await this.userService.getUserRole(userId.toString());

    if (!userRole || !['admin', 'host', 'underboss'].includes(userRole)) {
      await ctx.reply('❌ You do not have access to broadcast messages.');
      return;
    }

    await ctx.reply(`${username} Please select a city to broadcast the message:`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Create post',
              callback_data: 'create_post',
            },
          ],
        ],
      },
    });
  }
}
