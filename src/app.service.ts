// src/app.service.ts
import { Injectable } from '@nestjs/common';
import { Hears, Help, On, Start, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';

@Update()
@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Welcome to server!' };
  }

  @Start()
  async startCommand(ctx: Context) {
    await ctx.reply('Welcome');
  }

  @Help()
  async helpCommand(ctx: Context) {
    const buttons = Markup.keyboard([['Broadcast Message']]).resize();

    await ctx.reply(
      'Send me a sticker or press the "Broadcast Message" button to broadcast messages to groups.',
      buttons,
    );
  }

  @On('sticker')
  async onSticker(ctx: Context) {
    await ctx.reply('👍');

    // Show the main keyboard again
    const buttons = Markup.keyboard([['Broadcast Message']]).resize();

    await ctx.reply('Choose an option:', buttons);
  }

  @Hears('hi')
  async hearsHi(ctx: Context) {
    await ctx.reply('Hey there');

    // Show the main keyboard again
    const buttons = Markup.keyboard([['Broadcast Message']]).resize();

    await ctx.reply('Choose an option:', buttons);
  }
}
