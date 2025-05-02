import { Injectable } from '@nestjs/common';
import { Hears, Command, Update, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
@Injectable()
export class WelcomeService {
  getWelcome(): { message: string } {
    return { message: 'Welcome to the bot! How can I assist you today?' };
  }

  private userSteps = new Map<number, number>();
  private registeredUsers = new Set<number>();
  private userGroupMap = new Map<number, number>();

  @On('new_chat_members')
  async handleNewMember(ctx: any) {
    const newMembers = ctx.message?.new_chat_members;
    if (newMembers) {
      for (const member of newMembers) {
        this.userGroupMap.set(member.id, ctx.chat.id);

        // Mute the user and send a verification message
        await ctx.telegram.restrictChatMember(ctx.chat.id, member.id, {
          can_send_messages: false,
        });
        await ctx.replyWithMarkdown(
          `Welcome, ${member.first_name}! Please verify you are not a robot by clicking the button below.`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Verify', callback_data: `verify_${member.id}` }],
              ],
            },
          },
        );
      }
    }
  }

  @On('callback_query')
  async handleCallbackQuery(ctx: any) {
    const callbackData = ctx.callbackQuery?.data;
    const userId = ctx.callbackQuery?.from.id;

    if (callbackData?.startsWith('verify_')) {
      const targetUserId = parseInt(callbackData.split('_')[1], 10);

      if (userId === targetUserId) {
        if (this.registeredUsers.has(userId)) {
          await ctx.answerCbQuery('You are already verified.');
          return;
        }

        // Start private chat for verification
        await ctx.answerCbQuery();
        this.userSteps.set(userId, 1);
        await ctx.telegram.sendMessage(
          userId,
          'Let’s verify your details. Please provide the following information:',
        );
        await ctx.telegram.sendMessage(userId, 'What is your name?');
      } else {
        await ctx.answerCbQuery('You cannot verify for another user.', {
          show_alert: true,
        });
      }
    }
  }

  @On('text')
  async handlePrivateChat(ctx: any) {
    const userId = ctx.message?.from.id;
    if (!userId) return;

    const step = this.userSteps.get(userId);

    if (step === 1) {
      // Collect name
      const name = ctx.message?.text;
      this.userSteps.set(userId, 2);
      await ctx.reply('Which country are you from?');
    } else if (step === 2) {
      // Collect country
      const country = ctx.message?.text;
      this.userSteps.set(userId, 3);
      await ctx.reply('Which city are you from?');
    } else if (step === 3) {
      // Collect city
      const city = ctx.message?.text;
      this.userSteps.set(userId, 4);
      await ctx.reply('What is your favorite Mafia movie?');
    } else if (step === 4) {
      // Collect Mafia movie
      const mafiaMovie = ctx.message?.text;
      this.userSteps.set(userId, 5);
      await ctx.reply('What is your favorite Ninja Turtle character?');
    } else if (step === 5) {
      // Collect Ninja Turtle character
      const ninjaTurtle = ctx.message?.text;
      this.userSteps.delete(userId);
      this.registeredUsers.add(userId);

      // Send wallet connect button
      // await ctx.replyWithMarkdown(
      //   'Thank you for providing your details. Please connect your wallet by clicking the button below.',
      //   {
      //     reply_markup: {
      //       inline_keyboard: [
      //         [
      //           {
      //             text: 'Connect Wallet',
      //             url: 'https://your-wallet-connect-url.com',
      //           },
      //         ],
      //       ],
      //     },
      //   },
      // );

      const groupId = this.userGroupMap.get(userId);
      if (groupId) {
        await ctx.telegram.restrictChatMember(groupId, userId, {
          permissions: {
            can_send_messages: true,
            can_send_media_messages: true,
            can_send_polls: true,
            can_send_other_messages: true,
            can_add_web_page_previews: true,
            can_change_info: false,
            can_invite_users: true,
            can_pin_messages: false,
          },
        });
        await ctx.telegram.sendMessage(
          groupId,
          `User ${ctx.message?.from.first_name} has been verified and unmuted. Welcome to the group!`,
        );
      }
    }
  }

  @Command('welcome')
  async welcomeCommand(ctx: any) {
    await ctx.reply('hello world');
  }
}
