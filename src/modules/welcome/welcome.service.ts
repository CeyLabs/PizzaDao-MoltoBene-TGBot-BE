import { Injectable } from '@nestjs/common';
import { Update, On, Command, Start } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UserService } from '../user/user.service';
import { IUserRegistrationData } from './welcome.interface';
import { CountryService } from '../country/country.service';
import { CityService } from '../city/city.service';
import { IUser } from '../user/user.interface';

@Update()
@Injectable()
export class WelcomeService {
  constructor(
    private readonly userService: UserService,
    private readonly countryService: CountryService,
    private readonly cityService: CityService,
  ) {}

  private userSteps = new Map<number, number | string>();
  private userGroupMap = new Map<number, IUserRegistrationData>();

  @Start()
  async startCommand(ctx: Context) {
    const userId = ctx.message?.from.id ?? ctx.from?.id ?? 0;
    const firstName = ctx.message?.from.first_name || 'there';

    // Check if the user came through a deep link
    const startPayload =
      ctx.message && 'text' in ctx.message ? ctx.message.text.split(' ')[1] : null;
    if (startPayload && startPayload.startsWith('register_')) {
      const [, targetUserId, groupId] = startPayload.split('_');

      if (userId.toString() !== targetUserId) {
        await ctx.reply('❌ You cannot verify for another user.');
        return;
      }

      // Check if the user is already registered
      if (await this.userService.isUserRegistered(userId)) {
        await ctx.reply('You are already verified and registered!');
        return;
      }

      const cityDetails = await this.cityService.getCityByGroupId(groupId || '');

      // Save the group ID and start the verification process
      this.userGroupMap.set(userId, {
        telegram_id: userId,
        username: ctx.message?.from.username || null,
        tg_first_name: ctx.message?.from.first_name || null,
        tg_last_name: ctx.message?.from.last_name || null,
        group_id: groupId,
        custom_full_name: null,
        region_id: null,
        country_id: cityDetails?.country_id || null,
        city_id: cityDetails?.id || null,
        role: 'user',
        mafia_movie: null,
        ninja_turtle_character: null,
        pizza_topping: null,
      });

      this.userSteps.set(userId, 4);

      await ctx.reply(
        '📝 *Let’s verify your details\\!*\n\n' +
          'Please provide the following information to complete your registration:',
        {
          parse_mode: 'MarkdownV2',
        },
      );

      await ctx.reply('👤 *What is your full name?*\n\n' + 'Please type your full name below:', {
        reply_markup: {
          force_reply: true,
        },
        parse_mode: 'MarkdownV2',
      });

      return;
    }

    if (await this.userService.isUserRegistered(userId)) {
      await ctx.replyWithMarkdownV2(
        `👋 *Hello, ${(await this.userService.findUser(userId))?.custom_full_name || 'there'}\\!* \n\n` +
          `Welcome to *PizzaDAO Molto Bene Bot* 🍕\\. I'm here to assist you\\. \n\n` +
          `Here are some things you can do:\n` +
          `1\\. Use the /help command to see available options\\.\n` +
          `2\\. View your profile by clicking the button below\\.\n\n` +
          `Let's get started 🚀`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: '📋 View Profile', callback_data: 'view_profile' }]],
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

  @Command('profile')
  async handleProfileCommand(ctx: Context) {
    const userId = ctx.message?.from.id;
    if (!userId) return;

    const user = await this.userService.findUser(userId);
    if (!user) {
      await ctx.replyWithMarkdownV2(
        '❌ *You are not registered yet\\!*\n\n' +
          'Please use the /register command to start the registration process.',
      );
      return;
    }

    // Fetch country and city names from the database
    const country = user.country_id
      ? await this.countryService.getCountryById(user.country_id)
      : null;
    const city = user.city_id ? await this.cityService.getCityById(String(user.city_id)) : null;

    await ctx.replyWithMarkdownV2(
      `📋 *Your Profile*\n\n` +
        `👤 *Name*: ${user.custom_full_name || 'Not set'}\n` +
        `🌍 *Country*: ${country?.name || 'Not set'}\n` +
        `🏙️ *City*: ${city?.name || 'Not set'}\n` +
        `🎥 *Favorite Mafia Movie*: ${user.mafia_movie || 'Not set'}\n` +
        `🐢 *Favorite Ninja Turtle*: ${user.ninja_turtle_character || 'Not set'}\n` +
        `🍕 *Favorite Pizza Topping*: ${user.pizza_topping || 'Not set'}\n\n` +
        `What would you like to edit?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✏️ Edit Name', callback_data: 'edit_custom_full_name' },
              { text: '✏️ Edit Mafia Movie', callback_data: 'edit_mafia_movie' },
            ],
            [
              { text: '✏️ Edit Ninja Turtle', callback_data: 'edit_ninja_turtle_character' },
              { text: '✏️ Edit Pizza Topping', callback_data: 'edit_pizza_topping' },
            ],
            [{ text: '🔙 Back', callback_data: 'back_to_start' }],
          ],
        },
      },
    );
  }

  @Command('register')
  async handleUserRegistration(ctx: Context) {
    const userId = ctx.message?.from?.id ?? 0;
    if (!userId) return;

    if (await this.userService.isUserRegistered(userId)) {
      await ctx.replyWithMarkdownV2(
        '✅ *You are already verified and registered\\!*\n\n' +
          '🎉 Welcome back\\! If you need assistance, feel free to type /help or explore the available options\\.',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📋 View Profile', callback_data: 'view_profile' },
                { text: 'ℹ️ Help', callback_data: 'help' },
              ],
            ],
          },
        },
      );
      return;
    }

    this.userSteps.set(userId, 1);
    this.userGroupMap.set(userId, {
      telegram_id: userId,
      username: ctx.message?.from.username || null,
      tg_first_name: ctx.message?.from.first_name || null,
      tg_last_name: ctx.message?.from.last_name || null,
      custom_full_name: null,
      region_id: null,
      country_id: null,
      city_id: null,
      role: 'user',
      mafia_movie: null,
      ninja_turtle_character: null,
      pizza_topping: null,
    });

    // Fetch regions from the database
    const regions = await this.userService.getAllRegions();

    // Group regions into rows of 2 buttons
    const regionButtons: { text: string; callback_data: string }[][] = [];
    for (let i = 0; i < regions.length; i += 2) {
      regionButtons.push(
        regions.slice(i, i + 2).map((region) => ({
          text: region.name,
          callback_data: `region_${region.id}`,
        })),
      );
    }

    // Present regions as inline buttons
    await ctx.reply(
      '🌍 *Please select your region:*\n\n' +
        'Tap on one of the buttons below to choose your region\\.',
      {
        reply_markup: {
          inline_keyboard: regionButtons,
        },
        parse_mode: 'MarkdownV2',
      },
    );
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

    if (message?.new_chat_members) {
      for (const member of message.new_chat_members) {
        if (await this.userService.isUserRegistered(member.id)) {
          return;
        }

        // Store the group_id in userGroupMap
        this.userGroupMap.set(member.id, {
          group_id: chatId,
          telegram_id: member.id,
          username: member.username || null,
          tg_first_name: member.first_name || null,
          tg_last_name: member.last_name || null,
          custom_full_name: null,
          region_id: null,
          country_id: null,
          city_id: null,
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

        const botUsername = process.env.BOT_USERNAME;
        const deepLink = `https://t.me/${botUsername}?start=register_${member.id}_${chatId}`;

        const verificationMessage = await ctx.replyWithMarkdownV2(
          `👋 *Welcome\\, ${`[${member.first_name}](tg://user?id=${member.id})`}\\!*\n\n` +
            `🤖 Please verify you are not a robot by clicking the button below\\.\n\n` +
            `⏳ *You have 30 seconds to verify\\.*`,
          {
            reply_markup: {
              inline_keyboard: [[{ text: '✅ Verify', url: deepLink }]],
            },
          },
        );

        setTimeout(() => {
          void (async () => {
            try {
              await ctx.telegram.deleteMessage(chatId, verificationMessage.message_id);
            } catch {
              console.error('Failed to delete message.');
            }
          })();
        }, 30000);
      }
    }
  }

  @On('callback_query')
  async handleCallbackQuery(ctx: Context) {
    const callbackData =
      ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
    const userId = ctx.callbackQuery?.from.id;

    if (!userId) return;

    if (callbackData?.startsWith('region_')) {
      const regionId = callbackData.split('_')[1];
      const userData = this.userGroupMap.get(userId);

      if (userData) {
        userData.region_id = regionId; // Save the selected region
        this.userSteps.set(userId, 2);

        // Fetch countries for the selected region
        const countries = await this.countryService.getCountriesByRegion(regionId);

        // Group countries into rows of 2 buttons
        const countryButtons: { text: string; callback_data: string }[][] = [];
        for (let i = 0; i < countries.length; i += 2) {
          countryButtons.push(
            countries.slice(i, i + 2).map((country) => ({
              text: country.name,
              callback_data: `country_${country.id}`,
            })),
          );
        }

        // Present countries as inline buttons
        await ctx.editMessageText(
          '🌎 *Please select your country:*\n\n' +
            'Tap on one of the buttons below to choose your country\\.',
          {
            reply_markup: {
              inline_keyboard: countryButtons,
            },
            parse_mode: 'MarkdownV2',
          },
        );
      }
    } else if (callbackData?.startsWith('country_')) {
      const countryId = callbackData.split('_')[1];
      const userData = this.userGroupMap.get(userId);

      if (userData) {
        userData.country_id = countryId; // Save the selected country
        this.userSteps.set(userId, 3);

        // Fetch cities for the selected country
        const cities = await this.cityService.getCitiesByCountry(countryId);

        // Present cities as inline buttons
        await ctx.editMessageText(
          '🏙️ *Please select your city:*\n\n' +
            'Tap on one of the buttons below to choose your city\\.',
          {
            reply_markup: {
              inline_keyboard: cities.map((city) => [
                { text: city.name, callback_data: `city_${city.id}` },
              ]),
            },
            parse_mode: 'MarkdownV2',
          },
        );
      }
    } else if (callbackData?.startsWith('city_')) {
      const cityId = callbackData.split('_')[1];
      const userData = this.userGroupMap.get(userId);

      if (userData) {
        userData.city_id = cityId; // Save the selected city
        this.userSteps.set(userId, 4);

        // Ask for the user's name
        await ctx.deleteMessage();
        await ctx.reply(
          '👤 *Let’s get to know you\\!*\n\n' + 'What is your *full name*? Please type it below:',
          {
            reply_markup: {
              force_reply: true,
            },
            parse_mode: 'MarkdownV2',
          },
        );
      }
    } else if (callbackData?.startsWith('ninja_')) {
      const selectedCharacter = callbackData.split('_')[1];
      const userData = this.userGroupMap.get(userId);

      if (userData) {
        userData.ninja_turtle_character = selectedCharacter;
        this.userSteps.set(userId, 7);

        // Acknowledge the selection and ask the next question
        await ctx.answerCbQuery(
          `You selected ${selectedCharacter.charAt(0).toUpperCase() + selectedCharacter.slice(1)}!`,
        );

        await ctx.deleteMessage();
        await ctx.telegram.sendMessage(
          userId,
          '🍕 *What is your favorite pizza topping?*\n\n' +
            'Please type the name of your favorite pizza topping below:',
          {
            reply_markup: {
              force_reply: true,
            },
            parse_mode: 'MarkdownV2',
          },
        );
      }
    }

    if (callbackData === 'view_profile') {
      const user = await this.userService.findUser(userId);
      if (!user) {
        await ctx.answerCbQuery('You are not registered yet.');
        return;
      }

      // Fetch country and city names from the database
      const country = user.country_id
        ? await this.countryService.getCountryById(user.country_id)
        : null;
      const city = user.city_id ? await this.cityService.getCityById(String(user.city_id)) : null;

      await ctx.editMessageText(
        `📋 *Your Profile*\n\n` +
          `👤 *Name*: ${user.custom_full_name || 'Not set'}\n` +
          `🌍 *Country*: ${country?.name || 'Not set'}\n` +
          `🏙️ *City*: ${city?.name || 'Not set'}\n` +
          `🎥 *Favorite Mafia Movie*: ${user.mafia_movie || 'Not set'}\n` +
          `🐢 *Favorite Ninja Turtle*: ${user.ninja_turtle_character || 'Not set'}\n` +
          `🍕 *Favorite Pizza Topping*: ${user.pizza_topping || 'Not set'}\n\n` +
          `What would you like to edit?`,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✏️ Edit Name',
                  callback_data: 'edit_custom_full_name',
                },
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
    } else if (callbackData?.startsWith('edit_')) {
      const field = callbackData.split('_').slice(1).join('_');
      await ctx.editMessageText(`Please enter your new ${field.replaceAll('_', ' ')}:`);
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

      await this.userService.updateUserField(userId, field, newValue);

      this.userSteps.delete(userId);

      await ctx.reply(`Your ${field.replaceAll('_', ' ')} has been updated to "${newValue}".`);
      await this.startCommand(ctx);
    }

    if (!userData) return;

    if (step === 4) {
      // Collect name
      if ('text' in ctx.message) {
        userData.custom_full_name = ctx.message.text;
      } else {
        await ctx.reply('Invalid input. Please provide a valid name.');
        return;
      }
      this.userSteps.set(userId, 5);
      await ctx.reply(
        '🎥 *What is your favorite Mafia movie?*\n\n' +
          'Please type the name of your favorite Mafia movie below:',
        {
          reply_markup: {
            force_reply: true,
          },
          parse_mode: 'MarkdownV2',
        },
      );
    } else if (step === 5) {
      // Collect country
      if ('text' in ctx.message) {
        userData.mafia_movie = ctx.message.text;
      } else {
        await ctx.reply('Invalid input. Please provide a valid movie name.');
        return;
      }
      this.userSteps.set(userId, 6);

      const ninjaTurtleOptions = [
        [
          { text: 'Leonardo 🐢', callback_data: 'ninja_leonardo' },
          { text: 'Donatello 🛠️', callback_data: 'ninja_donatello' },
        ],
        [
          { text: 'Splinter 🧙', callback_data: 'ninja_splinter' },
          { text: 'Raphael 🤝', callback_data: 'ninja_raphael' },
        ],
        [
          { text: 'Michelangelo 🎨', callback_data: 'ninja_michelangelo' },
          { text: 'April 📝', callback_data: 'ninja_april' },
        ],
      ];

      await ctx.telegram.sendPhoto(userId, 'https://i.imgur.com/sFG1Icj.png', {
        caption:
          ' 🫶 *What can you offer the famiglia?*\n\n' +
          'Select a Ninja Turtle that best suits you:\n\n' +
          '🐢 *Leonardo*: _Community Management, Organizing, and Project Management\\. Putting the O in DAO\\!_\n\n' +
          '🛠️ *Donatello*: _Software Development and Technology Expert\\. Ready to build open source pizzeria tools\\. Pizza is tech too\\!_\n\n' +
          '🧙 *Splinter*: _Guru of Legal Systems and/or Accounting\\. Watch out for the team and keep them out of trouble\\!_\n\n' +
          '🤝 *Raphael*: _Business Development, Recruiting, and Sales\\. Build partnerships for the future of PizzaDAO\\._\n\n' +
          "🎨 *Michelangelo*: _Artist, Creative, or Meme Chef\\. Create art, music, and videos to spread pizza's glory\\!_\n\n" +
          '📝 *April*: _Storytelling, Writing, and Marketing\\. Spread the word throughout the universe \\(and the metaverse\\)\\._',
        reply_markup: {
          inline_keyboard: ninjaTurtleOptions,
        },
        parse_mode: 'MarkdownV2',
      });
    } else if (step === 7) {
      // Collect Mafia movie
      if ('text' in ctx.message) {
        userData.pizza_topping = ctx.message.text;
      } else {
        await ctx.reply('Invalid input. Please provide a valid topping name.');
        return;
      }

      // Save user data to the database
      const newUser: IUser = {
        telegram_id: userData.telegram_id,
        username: userData.username,
        tg_first_name: userData.tg_first_name,
        tg_last_name: userData.tg_last_name,
        custom_full_name: userData.custom_full_name,
        country_id: userData.country_id ?? null,
        city_id: userData.city_id ?? null,
        role: userData.role,
        mafia_movie: userData.mafia_movie,
        ninja_turtle_character: userData.ninja_turtle_character,
        pizza_topping: userData.pizza_topping,
      };

      await this.userService.addUser(newUser);

      const groupId = this.userGroupMap.get(userId)?.group_id;

      this.userSteps.delete(userId);
      this.userGroupMap.delete(userId);

      if (userData.city_id) {
        try {
          const city = await this.cityService.getCityById(userData.city_id);

          if (city?.telegram_link) {
            await ctx.reply(
              '🎉 *Thank you for providing your details\\!*\n\n' +
                '✅ You are now verified\\![­­­­­­­­­­](${telegramLink})\n\n' +
                "🌐 *Join your city's Telegram group using the link below:*\n\n",
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: 'Join Telegram Group',
                        url: city.telegram_link as string,
                      },
                    ],
                  ],
                },
                parse_mode: 'MarkdownV2',
              },
            );
          } else {
            await ctx.reply('No Telegram group link is available for your city.');
          }
        } catch (error) {
          console.error('Failed to fetch Telegram link:', error);
          await ctx.reply('An error occurred while fetching the Telegram group link.');
        }
      } else {
        await ctx.reply('City ID is not available.');
      }

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

        setTimeout(() => {
          void (async () => {
            try {
              await ctx.telegram.deleteMessage(groupId, welcomeMessage.message_id);
            } catch (error) {
              console.error('Failed to delete message:', error);
            }
          })();
        }, 10000);
      }
    }
  }
}
