import { Injectable } from '@nestjs/common';
import { Hears, Help, On, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
@Update()
@Injectable()
export class AppService {
  @Help()
  async helpCommand(ctx: Context) {
    await ctx.reply('Send me a sticker');
  }

  @Hears('hi')
  async hearsHi(ctx: Context) {
    await ctx.reply('Hey there');
  }
}
