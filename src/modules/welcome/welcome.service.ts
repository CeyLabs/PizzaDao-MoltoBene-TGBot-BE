import { Injectable } from '@nestjs/common';
import { Update, On, Command, Start } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../users/users.service';
import { UserRegistrationData } from './welcome.types';

@Update()
@Injectable()
export class WelcomeService {
  constructor(private readonly userRegistryService: UsersService) {}

  addUser(
    telegram_id: number,
    username: string | null,
    tg_first_name: string | null,
    tg_last_name: string | null,
    custom_full_name: string | null,
    country: string | null,
    city: string | null,
    role: string,
    mafia_movie: string | null,
    ninja_turtle_character: string | null,
    pizza_topping: string | null,
  ): void {
    this.userRegistryService.addUser(
      telegram_id,
      username,
      tg_first_name,
      tg_last_name,
      custom_full_name,
      country,
      city,
      role,
      mafia_movie,
      ninja_turtle_character,
      pizza_topping,
    );
  }

  isUserRegistered(userId: number): Promise<boolean> {
    return this.userRegistryService.isUserRegistered(userId);
  }

  findUser(userId: number) {
    return this.userRegistryService.findUser(userId);
  }

  private userSteps = new Map<number, number | string>();
  private userGroupMap = new Map<number, UserRegistrationData>();

  @Start()
  async startCommand(ctx: Context) {
    const userId = ctx.message?.from.id ?? ctx.from?.id ?? 0;
    const firstName = ctx.message?.from.first_name || 'there';

    if (await this.isUserRegistered(userId)) {
      await ctx.replyWithMarkdownV2(
        `👋 *Hello, ${(await this.findUser(userId)).custom_full_name}\\!* \n\n` +
          `Welcome to *PizzaDAO Molto Bene Bot* 🍕\\. I'm here to assist you\\. \n\n` +
          `Here are some things you can do:\n` +
          `1\\. Ask me for help anytime by typing /help\\.\n\n` +
          `Let's get started 🚀`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 View Profile', callback_data: 'view_profile' }],
            ],
          },
        },
      );
    } else {
      await ctx.replyWithMarkdownV2(
        `👋 *Hello, ${firstName}\\!* \n\n` +
          `Welcome to *PizzaDAO Molto Bene Bot* 🍕\\. I'm here to assist you\\. \n\n` +
          `Here are some things you can do:\n` +
          `1\\. Use the /register command to register yourself\\.\n` +
          `2\\. Verify yourself to join the group\\.\n` +
          `3\\. Ask me for help anytime by typing /help\\.\n\n` +
          `Let's get started 🚀`,
      );
      await ctx.reply(
        'It seems you are not registered yet. Please use the /register command to start the registration process.',
      );
    }
  }

  @Command('register')
  async handleUserRegistration(ctx: any) {
    const userId = ctx.message?.from.id;
    if (!userId) return;

    if (await this.isUserRegistered(userId)) {
      await ctx.reply('You are already verified and registered!');
      return;
    }

    this.userSteps.set(userId, 1);
    this.userGroupMap.set(userId, {
      telegram_id: userId,
      username: ctx.message?.from.username || null,
      tg_first_name: ctx.message?.from.first_name || null,
      tg_last_name: ctx.message?.from.last_name || null,
      custom_full_name: null,
      country: null,
      city: null,
      role: 'user',
      mafia_movie: null,
      ninja_turtle_character: null,
      pizza_topping: null,
    });

    await ctx.telegram.sendMessage(userId, 'What is your name?', {
      reply_markup: {
        force_reply: true,
      },
    });
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
      // Store the group_id in userGroupMap
      this.userGroupMap.set(member.id, {
        group_id: chatId,
        telegram_id: member.id,
        username: member.username || null,
        tg_first_name: member.first_name || null,
        tg_last_name: member.last_name || null,
        custom_full_name: null,
        country: null,
        city: null,
        role: 'user',
        mafia_movie: null,
        ninja_turtle_character: null,
        pizza_topping: null,
      });

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
  async handleCallbackQuery(ctx: Context) {
    const callbackQuery = ctx.callbackQuery as any;
    const callbackData = callbackQuery.data;
    const userId = ctx.callbackQuery?.from.id;

    if (!userId) return;

    if (callbackData?.startsWith('verify_')) {
      const targetUserId = parseInt(callbackData.split('_')[1], 10);

      if (userId === targetUserId) {
        if (await this.isUserRegistered(userId)) {
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

          const groupId = this.userGroupMap.get(userId)?.group_id;

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
    } else if (callbackData === 'view_profile') {
      const user = await this.findUser(userId);
      if (!user) {
        await ctx.answerCbQuery('You are not registered yet.');
        return;
      }

      await ctx.editMessageText(
        `📋 *Your Profile*\n\n` +
          `👤 *Name*: ${user.custom_full_name || 'Not set'}\n` +
          `🌍 *Country*: ${user.country || 'Not set'}\n` +
          `🏙️ *City*: ${user.city || 'Not set'}\n` +
          `🎥 *Favorite Mafia Movie*: ${user.mafia_movie || 'Not set'}\n` +
          `🐢 *Favorite Ninja Turtle*: ${user.ninja_turtle_character || 'Not set'}\n` +
          `🍕 *Favorite Pizza Topping*: ${user.pizza_topping || 'Not set'}\n\n` +
          `What would you like to edit?`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✏️ Edit Name',
                  callback_data: 'edit_custom_full_name',
                },
                { text: '✏️ Edit Country', callback_data: 'edit_country' },
              ],
              [
                { text: '✏️ Edit City', callback_data: 'edit_city' },
                {
                  text: '✏️ Edit Mafia Movie',
                  callback_data: 'edit_mafia_movie',
                },
              ],
              [
                {
                  text: '✏️ Edit Ninja Turtle',
                  callback_data: 'edit_ninja_turtle_character',
                },
                {
                  text: '✏️ Edit Pizza Topping',
                  callback_data: 'edit_pizza_topping',
                },
              ],
              [{ text: '🔙 Back', callback_data: 'back_to_start' }],
            ],
          },
        },
      );
    } else if (callbackData.startsWith('edit_')) {
      const field = callbackData.split('_').slice(1).join('_');
      await ctx.editMessageText(
        `Please enter your new ${field.replace('_', ' ')}:`,
      );
      this.userSteps.set(userId, `edit_${field}`);
    } else if (callbackData === 'back_to_start') {
      await ctx.deleteMessage();
      await this.startCommand(ctx);
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
  async handlePrivateChat(ctx: Context) {
    const userId = ctx.message?.from.id;
    if (!userId) return;

    const step = this.userSteps.get(userId);
    const userData = this.userGroupMap.get(userId);

    if (step && typeof step === 'string' && step.startsWith('edit_')) {
      const field = step.split('_').slice(1).join('_');
      const newValue = 'text' in ctx.message ? ctx.message.text : null;

      if (!newValue) {
        await ctx.reply('Invalid input. Please provide a valid value.');
        return;
      }

      await this.userRegistryService.updateUserField(userId, field, newValue);

      this.userSteps.delete(userId);

      await ctx.reply(
        `Your ${field.replaceAll('_', ' ')} has been updated to "${newValue}".`,
      );
      await this.startCommand(ctx);
    }

    if (!userData) return;

    if (step === 1) {
      // Collect name
      if ('text' in ctx.message) {
        userData.custom_full_name = ctx.message.text;
      } else {
        await ctx.reply('Invalid input. Please provide a valid name.');
        return;
      }
      this.userSteps.set(userId, 2);
      await ctx.reply('Which country are you from?', {
        reply_markup: {
          force_reply: true,
        },
      });
    } else if (step === 2) {
      // Collect country
      if ('text' in ctx.message) {
        userData.country = ctx.message.text;
      } else {
        await ctx.reply('Invalid input. Please provide a valid country.');
        return;
      }
      this.userSteps.set(userId, 3);
      await ctx.reply('Which city are you from?', {
        reply_markup: {
          force_reply: true,
        },
      });
    } else if (step === 3) {
      // Collect city
      if ('text' in ctx.message) {
        userData.city = ctx.message.text;
      } else {
        await ctx.reply('Invalid input. Please provide a valid city.');
        return;
      }
      this.userSteps.set(userId, 4);
      await ctx.reply('What is your favorite Mafia movie?', {
        reply_markup: {
          force_reply: true,
        },
      });
    } else if (step === 4) {
      // Collect Mafia movie
      if ('text' in ctx.message) {
        userData.mafia_movie = ctx.message.text;
      } else {
        await ctx.reply('Invalid input. Please provide a valid movie name.');
        return;
      }
      this.userSteps.set(userId, 5);
      await ctx.reply('What is your favorite Ninja Turtle character?', {
        reply_markup: {
          force_reply: true,
        },
      });
    } else if (step === 5) {
      // Collect Ninja Turtle character
      if ('text' in ctx.message) {
        userData.ninja_turtle_character = ctx.message.text;
      } else {
        await ctx.reply(
          'Invalid input. Please provide a valid character name.',
        );
        return;
      }
      this.userSteps.set(userId, 6);
      await ctx.reply('What is your favorite pizza topping?', {
        reply_markup: {
          force_reply: true,
        },
      });
    } else if (step === 6) {
      // Collect pizza topping and save to database
      if ('text' in ctx.message) {
        userData.pizza_topping = ctx.message.text;
      } else {
        await ctx.reply('Invalid input. Please provide a valid topping name.');
        return;
      }

      // Save user data to the database
      this.addUser(
        userData.telegram_id,
        userData.username,
        userData.tg_first_name,
        userData.tg_last_name,
        userData.custom_full_name,
        userData.country,
        userData.city,
        userData.role,
        userData.mafia_movie,
        userData.ninja_turtle_character,
        userData.pizza_topping,
      );

      this.userSteps.delete(userId);
      this.userGroupMap.delete(userId);

      await ctx.reply(
        'Thank you for providing your details! You are now verified.',
      );

      const groupId = this.userGroupMap.get(userId)?.group_id;
      if (groupId) {
        await ctx.telegram.restrictChatMember(groupId, userId, {
          permissions: {
            can_send_messages: true,
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
