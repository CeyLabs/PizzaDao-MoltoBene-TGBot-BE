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
    await ctx.reply('Please select a city to broadcast the message:', {
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
