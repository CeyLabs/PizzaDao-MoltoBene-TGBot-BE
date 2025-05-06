import { Injectable } from '@nestjs/common';
import { Command, Hears, Help, On, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from './modules/users/users.service';
@Update()
@Injectable()
export class AppService {
  constructor(private readonly userRegistryService: UsersService) {}

  isUserRegistered(userId: number): boolean {
    return this.userRegistryService.isUserRegistered(userId);
  }

  @Start()
  async startCommand(ctx: Context) {
    const userId = ctx.message?.from.id ?? 0;

    console.log('User ID:', userId);
    console.log(this.isUserRegistered(userId));

    if (this.isUserRegistered(userId)) {
      await ctx.reply('You are already registered and verified!');
    } else {
      await ctx.reply(
        'Welcome! It seems you are not registered yet. Please use the /register command to start the registration process.'
      );
    }

    await ctx.reply('Welcome');
  }

  @Help()
  async helpCommand(ctx: Context) {
    await ctx.reply('Send me a sticker');
  }

  @On('sticker')
  async onSticker(ctx: Context) {
    await ctx.reply('👍');
  }

  @Hears('hi')
  async hearsHi(ctx: Context) {
    await ctx.reply('Hey there');
  }
}