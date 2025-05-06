import { Injectable } from '@nestjs/common';
import { Update, On, Command, Start } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../users/users.service';

@Update()
@Injectable()
export class WelcomeService {
  constructor(private readonly userRegistryService: UsersService) {}

  addUser(userId: number): void {
    this.userRegistryService.addUser(userId);
  }

  isUserRegistered(userId: number): boolean {
    return this.userRegistryService.isUserRegistered(userId);
  }

  private userSteps = new Map<number, number>();
  private userGroupMap = new Map<number, number>();

  @Start()
  async startCommand(ctx: Context) {
    const userId = ctx.message?.from.id ?? 0;

    if (this.isUserRegistered(userId)) {
      await ctx.reply('You are already registered and verified!');
    } else {
      await ctx.reply(
        'Welcome! It seems you are not registered yet. Please use the /register command to start the registration process.',
      );
    }
  }

  @On('new_chat_members')
  async handleNewMember(ctx: Context) {
    const { message } = ctx;

    if (!message || !('new_chat_members' in message) || !('chat' in message)) {
      return;
    }

    const chatId = ctx.chat?.id ?? 0;

    try {
      await ctx.telegram.deleteMessage(chatId, message.message_id);
    } catch (error) {
      console.error('Failed to delete the new member message:', error);
    }

    for (const member of message?.new_chat_members) {
      this.userGroupMap.set(member.id, chatId);

      // Mute the user and send a verification message
      await ctx.telegram.restrictChatMember(chatId, member.id, {
        permissions: {
          can_send_messages: false,
        },
      });
      const verificationMessage = await ctx.replyWithMarkdownV2(
        `Welcome\, ${`[${member.first_name}](tg://user?id=${member.id})`} \\! Please verify you are not a robot by clicking the button below\\. You have 30 seconds to verify\\.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Verify', callback_data: `verify_${member.id}` }],
            ],
          },
        },
      );

      setTimeout(async () => {
        try {
          await ctx.telegram.deleteMessage(
            chatId,
            verificationMessage.message_id,
          );
        } catch (error) {
          console.error('Failed to delete message:', error);
        }
      }, 30000);
    }
  }

  @On('callback_query')
  async handleCallbackQuery(ctx: any) {
    const callbackQuery = ctx.callbackQuery as any;
    const callbackData = callbackQuery.data;
    const userId = ctx.callbackQuery?.from.id;

    if (callbackData?.startsWith('verify_')) {
      const targetUserId = parseInt(callbackData.split('_')[1], 10);

      if (userId === targetUserId) {
        if (this.isUserRegistered(userId)) {
          await ctx.answerCbQuery('You are already verified.');
          return;
        }

        // Start private chat for verification
        await ctx.answerCbQuery();
        this.userSteps.set(userId, 1);

        try {
          await ctx.telegram.sendMessage(
            userId,
            'Let’s verify your details. Please provide the following information:',
          );
          await ctx.telegram.sendMessage(userId, 'What is your name?', {
            reply_markup: {
              force_reply: true,
            },
          });
        } catch (error) {
          const botUsername = ctx.botInfo?.username || 'your_bot_username';

          const groupId = this.userGroupMap.get(userId);

          if (groupId) {
            const verificationMessage = await ctx.telegram.sendMessage(
              groupId,
              `It seems you haven't started the bot in a private chat. Please click [this link](https://t.me/${botUsername}) to start the bot and then click "Verify" again. You have 30 seconds to verify.`,
              {
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: 'Verify', callback_data: `verify_${userId}` }],
                  ],
                },
              },
            );

            setTimeout(async () => {
              try {
                await ctx.telegram.deleteMessage(
                  groupId,
                  verificationMessage.message_id,
                );
              } catch (error) {
                console.error('Failed to delete message:', error);
              }
            }, 30000);
          }
        }
      } else {
        await ctx.answerCbQuery('You cannot verify for another user.', {
          show_alert: true,
        });
      }
    }
  }

  @On('left_chat_member')
  async handleLeftChatMember(ctx: Context) {
    const { message } = ctx;
    const chatId = ctx.chat?.id ?? 0;

    if (message) {
      await ctx.telegram.deleteMessage(chatId, message.message_id);
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
      await ctx.reply('Which country are you from?', {
        reply_markup: {
          force_reply: true,
        },
      });
    } else if (step === 2) {
      // Collect country
      const country = ctx.message?.text;
      this.userSteps.set(userId, 3);
      await ctx.reply('Which city are you from?', {
        reply_markup: {
          force_reply: true,
        },
      });
    } else if (step === 3) {
      // Collect city
      const city = ctx.message?.text;
      this.userSteps.set(userId, 4);
      await ctx.reply('What is your favorite Mafia movie?', {
        reply_markup: {
          force_reply: true,
        },
      });
    } else if (step === 4) {
      // Collect Mafia movie
      const mafiaMovie = ctx.message?.text;
      this.userSteps.set(userId, 5);
      await ctx.reply('What is your favorite Ninja Turtle character?', {
        reply_markup: {
          force_reply: true,
        },
      });
    } else if (step === 5) {
      // Collect Ninja Turtle character
      const ninjaTurtle = ctx.message?.text;
      this.userSteps.delete(userId);
      this.addUser(userId);

      await ctx.reply(
        'Thank you for providing your details! You are now verified.',
      );

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

        const welcomeMessage = await ctx.telegram.sendMessage(
          groupId,
          `User ${`[${ctx.message?.from.first_name}](tg://user?id=${ctx.message?.from.id})`} has been verified and unmuted\\. Welcome to the group\\!`,
          {
            parse_mode: 'MarkdownV2',
          },
        );

        setTimeout(async () => {
          try {
            await ctx.telegram.deleteMessage(
              groupId,
              welcomeMessage.message_id,
            );
          } catch (error) {
            console.error('Failed to delete verified message:', error);
          }
        }, 10000);
      }
    }
  }
}
