import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { UserService } from '../user/user.service';
import { IUserRegistrationData } from './welcome.interface';
import { CountryService } from '../country/country.service';
import { CityService } from '../city/city.service';
import { IUser } from '../user/user.interface';
import axios from 'axios';

@Injectable()
export class WelcomeService {
  private readonly openAiApiKey = process.env.OPENAI_API_KEY;

  constructor(
    private readonly userService: UserService,
    private readonly countryService: CountryService,
    private readonly cityService: CityService,
  ) {}

  private userSteps = new Map<number, number | string>();
  private userGroupMap = new Map<number, IUserRegistrationData>();

  async handleStartCommand(ctx: Context) {
    const userId = ctx.message?.from.id ?? ctx.from?.id ?? 0;

    // Check if the user came through a deep link
    const startPayload =
      ctx.message && 'text' in ctx.message ? ctx.message.text.split(' ')[1] : null;

    if (startPayload && startPayload.startsWith('register_')) {
      const [, targetUserId, groupId] = startPayload.split('_');

      if (userId.toString() !== targetUserId) {
        await ctx.reply('❌ You cannot verify for another user.');
        return;
      }

      const cityDetails = await this.cityService.getCityByGroupId(groupId || '');
      if (!cityDetails) {
        await ctx.reply('❌ City details not found for this group.');
        return;
      }

      // Check if the user is already registered
      const isRegistered = await this.userService.isUserRegistered(userId);

      if (isRegistered) {
        // Check if the user is already registered in the current city
        const isInCity = await this.userService.isUserInCity(userId, cityDetails.id);

        if (isInCity) {
          await ctx.replyWithMarkdownV2(
            `✅ You are already verified and registered in *${cityDetails.name}* city\\!`,
          );
          return;
        } else {
          await ctx.replyWithMarkdownV2(
            `*You are not registered in the current city \\(${cityDetails.name}\\)\\.* Would you like to register?`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '✅ Yes',
                      callback_data: `confirm_register_${groupId}`,
                    },
                    { text: '❌ No', callback_data: 'cancel_register' },
                  ],
                ],
              },
            },
          );
          return;
        }
      }

      await ctx.replyWithMarkdownV2(
        `Welcome to PizzaDAO's 5th annual *Global Pizza Party* in honor of Bitcoin Pizza Day\\.\n` +
          `It's been 15 years since May 22, 2010, when Laszlo Hanyecz bought two pizzas for 10,000 bitcoin\\. Today, 10,000 bitcoin buys a lot more than two pizzas\\! \n\n` +
          `We think that's a big deal\\. So we're throwing our 5th [Global Pizza Party](https://globalpizzaparty.xyz/) yet\\! We're expecting over 25,000 total attendees across more than 400 cities worldwide\\.\n\n`,
      );

      // Save the group ID and start the verification process
      this.userGroupMap.set(userId, {
        telegram_id: userId,
        username: ctx.message?.from.username || null,
        tg_first_name: ctx.message?.from.first_name || null,
        tg_last_name: ctx.message?.from.last_name || null,
        pizza_name: null,
        discord_name: null,
        group_id: groupId,
        region_id: null,
        role: 'user',
        mafia_movie: null,
        ninja_turtle_character: [],
        pizza_topping: null,
      });

      await ctx.reply('Are you in PizzaDAO discord and Do you already have a Pizza Name?', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Yes I have a Pizza Name 🍕', callback_data: 'has_pizza_name' }],
            [
              {
                text: 'Join Discord',
                url: 'https://discord.gg/rwthAq3e?event=1366460552074756220',
              },
            ],
            [{ text: 'Give me a Pizza Name', callback_data: 'give_me_pizza_name' }],
          ],
        },
        parse_mode: 'MarkdownV2',
      });

      return;
    } else {
      if (await this.userService.isUserRegistered(userId)) {
        await this.handleProfile(ctx);
      } else {
        await ctx.sendPhoto('https://i.imgur.com/WIUrVic.png', {
          caption:
            `Welcome to PizzaDAO's 5th annual *Global Pizza Party* in honor of Bitcoin Pizza Day\\.\n` +
            `It's been 15 years since May 22, 2010, when Laszlo Hanyecz bought two pizzas for 10,000 bitcoin\\. Today, 10,000 bitcoin buys a lot more than two pizzas\\! \n\n` +
            `We think that's a big deal\\. So we're throwing our 5th [Global Pizza Party](https://globalpizzaparty.xyz/) yet\\! We're expecting over 25,000 total attendees across more than 400 cities worldwide\\.\n\n`,
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Explore Party Cities 🎉',
                  callback_data: 'explore_cities',
                },
              ],
            ],
          },
        });
      }
    }
  }

  async handleProfile(ctx: Context) {
    const userId = ctx.message?.from.id || ctx.callbackQuery?.from.id;
    if (!userId) return;

    const user = await this.userService.findUser(userId);
    if (!user) {
      await ctx.replyWithMarkdownV2(
        '❌ *You are not registered yet\\!*\n\n' +
          'Please use the /register command to join PizzaDAO party group\\.',
      );
      return;
    }

    // Fetch cities the user has participated in
    const cities = await this.userService.getCitiesByUser(userId);
    const cityList = cities.map((city) => `• ${city.city_name}`).join('\n') || 'None';

    await ctx.replyWithMarkdownV2(
      `📋 *Your Profile*\n\n` +
        `👤 *Discord Name*: \\#${user.discord_name || 'Not set'}\n` +
        `🌍 *Participated Cities*: \n${cityList}\n` +
        `🎥 *Favorite Mafia Movie*: ${user.mafia_movie || 'Not set'}\n` +
        `🐢 *Favorite Ninja Turtle*: ${Array.isArray(user.ninja_turtle_character) ? user.ninja_turtle_character.join(', ') : 'Not set'}\n` +
        `🍕 *Favorite Pizza Topping*: ${user.pizza_topping || 'Not set'}\n\n` +
        `What would you like to edit?`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✏️ Edit Discord Name', callback_data: 'edit_discord_name' }],
            [{ text: '✏️ Edit Ninja Turtle', callback_data: 'edit_ninja_turtle_character' }],
            [{ text: 'Explore Party Cities 🎉', callback_data: 'explore_cities' }],
            [{ text: 'Refresh Profile', callback_data: 'refresh_profile' }],
          ],
        },
      },
    );
  }

  async handleUserRegistration(ctx: Context) {
    const userId = ctx.message?.from?.id ?? 0;
    if (!userId) return;

    if (await this.userService.isUserRegistered(userId)) {
      await ctx.replyWithMarkdownV2(
        '✅ *You are already verified and registered\\!*\n\n' +
          '🎉 Welcome back\\! If you need assistance, feel free to type /help\\.',
      );
      return;
    }

    await this.handleRegionSelection(ctx);
  }

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
          pizza_name: null,
          discord_name: null,
          region_id: null,
          role: 'user',
          mafia_movie: null,
          ninja_turtle_character: [],
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

  async handleCallbackQuery(ctx: Context) {
    const callbackData =
      ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
    const userId = ctx.callbackQuery?.from.id;

    if (!userId) return;

    // CallBackQuery[Explore Parties]: Handle Explore Cities button
    if (callbackData === 'explore_cities') {
      this.userSteps.set(userId, 1);
      this.userGroupMap.set(userId, {
        telegram_id: userId,
        username: ctx.message?.from.username || null,
        tg_first_name: ctx.message?.from.first_name || null,
        tg_last_name: ctx.message?.from.last_name || null,
        pizza_name: null,
        discord_name: null,
        region_id: null,
        role: 'user',
        mafia_movie: null,
        ninja_turtle_character: [],
        pizza_topping: null,
      });

      await ctx.deleteMessage();
      await this.handleRegionSelection(ctx);
      return;
    }

    // CallBackQuery[Explore Parties]: Handle Region button
    if (callbackData?.startsWith('region_')) {
      const regionId = callbackData.split('_')[1];
      const userData = this.userGroupMap.get(userId);

      if (userData) {
        userData.region_id = regionId;
        this.userSteps.set(userId, 2);

        await this.handleCountrySelection(ctx, regionId);
      }
    }

    // CallBackQuery[Explore Parties]: Handle Country button
    if (callbackData?.startsWith('country_')) {
      const countryId = callbackData.split('_')[1];
      const userData = this.userGroupMap.get(userId);

      if (userData) {
        // Fetch cities for the selected country
        const cities = await this.cityService.getCitiesByCountry(countryId);

        // Group cities into rows of 2 buttons
        const cityButtons: { text: string; url: string }[][] = [];
        for (let i = 0; i < cities.length; i += 2) {
          cityButtons.push(
            cities.slice(i, i + 2).map((city) => ({
              text: city.name,
              url: city.telegram_link || 'https://discord.gg/rwthAq3e?event=1366460552074756220',
            })),
          );
        }

        // Present cities as inline buttons
        await ctx.editMessageText(
          '🏙️ *Please select your city:*\n\n' +
            'Tap on one of the buttons below to choose your city\\.',
          {
            reply_markup: {
              inline_keyboard: [
                ...cityButtons,
                [
                  {
                    text: '🔙 Back',
                    callback_data: 'back_to_country',
                  },
                ],
              ],
            },
            parse_mode: 'MarkdownV2',
          },
        );
      }
    }

    // CallBakQuery[Register City]: Handle confirmation for city registration
    if (callbackData?.startsWith('confirm_register_')) {
      const [, groupId] = callbackData.split('_').slice(1);

      const cityDetails = await this.cityService.getCityByGroupId(groupId || '');
      if (!cityDetails) {
        return;
      }

      // Add city participation for the user
      await this.userService.addCityParticipation(userId, cityDetails.id, cityDetails?.country_id);

      await ctx.deleteMessage();
      await ctx.replyWithMarkdownV2(
        `✅ You have successfully registered in the *${cityDetails.name}* city\\!`,
      );
      return;
    }

    // CallBakQuery[Register City]: Handle cancellation of city registration
    if (callbackData === 'cancel_register') {
      await ctx.reply('❌ Registration canceled.');
      return;
    }

    // CallBackQuery[Profile]: Handle 'Refresh Profile' button
    if (callbackData === 'refresh_profile') {
      await ctx.deleteMessage();
      await this.handleProfile(ctx);
    }

    // CallBackQuery[Profile]: Handle 'Edit Profile' button
    if (callbackData?.startsWith('edit_')) {
      if (callbackData === 'edit_ninja_turtle_character') {
        await this.handleNinjaTurtleMessage(ctx);
      } else {
        const field = callbackData.split('_').slice(1).join('_');
        await ctx.deleteMessage();
        await ctx.reply(`Please enter your new ${field.replaceAll('_', ' ')}:`, {
          reply_markup: {
            force_reply: true,
          },
        });
        this.userSteps.set(userId, `edit_${field}`);
      }
    } else if (callbackData === 'back_to_region') {
      await ctx.deleteMessage();
      await this.handleRegionSelection(ctx);
    } else if (callbackData === 'back_to_country') {
      const userData = this.userGroupMap.get(userId);

      if (userData?.region_id) {
        await this.handleCountrySelection(ctx, userData.region_id);
      } else {
        await ctx.reply('❌ Unable to go back to the country selection. Please start again.');
      }
    }

    // CallBackQuery[Register User]: Handle 'Yes, I have a Pizza Name' button
    if (callbackData === 'has_pizza_name') {
      await ctx.deleteMessage();
      this.userSteps.set(userId, 'discord_pizza_name');
      await ctx.reply('🍕 What is your Pizza Name?', {
        reply_markup: {
          force_reply: true,
        },
        parse_mode: 'MarkdownV2',
      });
    }

    // CallBackQuery[Register User]: Handle 'Give me a Pizza Name' button
    if (callbackData === 'give_me_pizza_name') {
      await ctx.deleteMessage();
      this.userSteps.set(userId, 'pizza_topping');
      await ctx.reply('🍕 What is your favorite pizza topping?', {
        reply_markup: {
          force_reply: true,
        },
        parse_mode: 'MarkdownV2',
      });
    }

    // CallBackQuery[Register User]: Handle 'Ninja Turtle' button
    if (callbackData?.startsWith('ninja_')) {
      if (callbackData === 'ninja_confirm') {
        await this.handleNinjaTurtleConfirm(ctx);
      } else {
        await this.handleNinjaTurtleSelection(ctx, callbackData);
      }
    }
  }

  // Handle left chat member
  async handleLeftChatMember(ctx: Context) {
    const { message } = ctx;
    const chatId = ctx.chat?.id ?? 0;

    if (message) {
      await ctx.telegram.deleteMessage(chatId, message.message_id);
    }
  }

  async handleUserRegister(ctx: Context) {
    const userId = ctx.message?.from.id || ctx.callbackQuery?.from.id;
    if (!userId) return;

    const userData = this.userGroupMap.get(userId);
    if (!userData) return;

    // Save user data to the database
    const newUser: IUser = {
      telegram_id: userData.telegram_id,
      username: userData.username,
      tg_first_name: userData.tg_first_name,
      tg_last_name: userData.tg_last_name,
      pizza_name: userData.pizza_name,
      discord_name: userData.discord_name,
      role: userData.role,
      mafia_movie: userData.mafia_movie,
      ninja_turtle_character: userData.ninja_turtle_character,
      pizza_topping: userData.pizza_topping,
    };

    await this.userService.addUser(newUser);

    const cityDetails = await this.cityService.getCityByGroupId(userData.group_id || '');

    await this.userService.addCityParticipation(
      userData.telegram_id,
      cityDetails?.id || '',
      cityDetails?.country_id || '',
    );

    this.userSteps.delete(userId);
    this.userGroupMap.delete(userId);
  }

  async handleNinjaTurtleMessage(ctx: Context) {
    const userId = ctx.message?.from.id || ctx.callbackQuery?.from.id;
    if (!userId) return;

    this.userSteps.set(userId, 'ninja_turtle_character');

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

    try {
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
    } catch (error) {
      console.error('Failed to send Ninja Turtle message:', error);
    }
  }

  // Handle Ninja Turtle selection
  async handleNinjaTurtleSelection(ctx: Context, callbackData: string) {
    const userId = ctx.callbackQuery?.from.id;
    if (!userId) return;

    const userData = await this.populateUserData(userId);
    if (!userData) {
      await ctx.reply('❌ User data not found. Please register again.');
      return;
    }

    const selectedCharacter = callbackData.split('_')[1];

    // Toggle selection
    userData.ninja_turtle_character = userData.ninja_turtle_character || [];
    const index = userData.ninja_turtle_character.indexOf(selectedCharacter);

    if (index === -1) {
      userData.ninja_turtle_character.push(selectedCharacter); // Add if not selected
    } else {
      userData.ninja_turtle_character.splice(index, 1); // Remove if already selected
    }

    // Generate updated buttons with tick emojis
    const ninjaTurtleOptions = [
      [
        {
          text: userData.ninja_turtle_character.includes('leonardo')
            ? 'Leonardo 🐢 ✅'
            : 'Leonardo 🐢',
          callback_data: 'ninja_leonardo',
        },
        {
          text: userData.ninja_turtle_character.includes('donatello')
            ? 'Donatello 🛠️ ✅'
            : 'Donatello 🛠️',
          callback_data: 'ninja_donatello',
        },
      ],
      [
        {
          text: userData.ninja_turtle_character.includes('splinter')
            ? 'Splinter 🧙 ✅'
            : 'Splinter 🧙',
          callback_data: 'ninja_splinter',
        },
        {
          text: userData.ninja_turtle_character.includes('raphael')
            ? 'Raphael 🤝 ✅'
            : 'Raphael 🤝',
          callback_data: 'ninja_raphael',
        },
      ],
      [
        {
          text: userData.ninja_turtle_character.includes('michelangelo')
            ? 'Michelangelo 🎨 ✅'
            : 'Michelangelo 🎨',
          callback_data: 'ninja_michelangelo',
        },
        {
          text: userData.ninja_turtle_character.includes('april') ? 'April 📝 ✅' : 'April 📝',
          callback_data: 'ninja_april',
        },
      ],
      [
        { text: '✅ Confirm', callback_data: 'ninja_confirm' }, // Confirm button
      ],
    ];

    // Edit the message with updated buttons
    await ctx.editMessageCaption(
      '🫶 *What can you offer the famiglia?*\n\n' +
        'Select a Ninja Turtle that best suits you:\n\n' +
        '🐢 *Leonardo*: _Community Management, Organizing, and Project Management\\. Putting the O in DAO\\!_\n\n' +
        '🛠️ *Donatello*: _Software Development and Technology Expert\\. Ready to build open source pizzeria tools\\. Pizza is tech too\\!_\n\n' +
        '🧙 *Splinter*: _Guru of Legal Systems and/or Accounting\\. Watch out for the team and keep them out of trouble\\!_\n\n' +
        '🤝 *Raphael*: _Business Development, Recruiting, and Sales\\. Build partnerships for the future of PizzaDAO\\._\n\n' +
        "🎨 *Michelangelo*: _Artist, Creative, or Meme Chef\\. Create art, music, and videos to spread pizza's glory\\!_\n\n" +
        '📝 *April*: _Storytelling, Writing, and Marketing\\. Spread the word throughout the universe \\(and the metaverse\\)\\._',
      {
        reply_markup: {
          inline_keyboard: ninjaTurtleOptions,
        },
        parse_mode: 'MarkdownV2',
      },
    );
  }

  // Handle Ninja Turtle confirmation
  async handleNinjaTurtleConfirm(ctx: Context) {
    const userId = ctx.callbackQuery?.from.id;
    if (!userId) return false;

    const userData = await this.populateUserData(userId);
    if (!userData) {
      await ctx.reply('❌ User data not found. Please register first.');
      return;
    }

    const formattedArray = `{${userData.ninja_turtle_character?.join(',')}}`;

    const isRegistered = await this.userService.isUserRegistered(userId);

    if (isRegistered) {
      // Update only the Ninja Turtle selection for existing users
      await this.userService.updateUserField(userId, 'ninja_turtle_character', formattedArray);

      // Acknowledge the confirmation
      await ctx.answerCbQuery('Your Ninja Turtle selection has been updated!');
      await ctx.deleteMessage();

      // Refresh the profile
      await this.handleProfile(ctx);
    } else {
      // Complete the registration process for new users
      userData.ninja_turtle_character = formattedArray
        .slice(1, -1)
        .split(',')
        .map((char) => char.trim());

      await this.handleUserRegister(ctx);

      await ctx.answerCbQuery('Your selection has been confirmed!');
      await ctx.deleteMessage();

      // Enable group permissions
      const groupId = userData.group_id;
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
          `User ${`[${ctx.callbackQuery?.from.first_name}](tg://user?id=${userId})`} has been verified and unmuted\\. Welcome to the group\\!`,
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

        await this.handleProfile(ctx);
      }
    }
  }

  private async populateUserData(userId: number): Promise<IUserRegistrationData | null> {
    // Check if the user is already in userGroupMap
    let userData = this.userGroupMap.get(userId);

    if (!userData) {
      // Fetch user data from the database
      const user = await this.userService.findUser(userId);
      if (!user) {
        console.error(`User with ID ${userId} not found in the database.`);
        return null;
      }

      // Populate userGroupMap with data from the database
      userData = {
        telegram_id: user.telegram_id,
        username: user.username,
        tg_first_name: user.tg_first_name,
        tg_last_name: user.tg_last_name,
        pizza_name: user.pizza_name,
        discord_name: user.discord_name,
        group_id: null, // Group ID is not relevant for updates
        region_id: null,
        role: user.role,
        mafia_movie: user.mafia_movie,
        ninja_turtle_character: user.ninja_turtle_character || [],
        pizza_topping: user.pizza_topping,
      };

      this.userGroupMap.set(userId, userData);
    }

    return userData;
  }

  // Method to call ChatGPT API
  private async generatePizzaName(
    firstName: string,
    pizzaTopping: string,
    mafiaCharacter: string,
  ): Promise<string> {
    const prompt = `Create a fun and creative pizza name using the the pizza topping "${pizzaTopping}", and the mafia character "${mafiaCharacter}.only send one name and remember that name should only contain 2 name like first name and last name. as an example "Charlie Margharita". don't ask me is it better or anyhting just send the name".`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'assistant', content: prompt }],
          temperature: 0.3,
          max_tokens: 50,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openAiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response) return 'Unknown Pizza Name';

      const pizzaName: string = (
        response.data as {
          choices: { message: { content: string } }[];
        }
      ).choices[0].message.content.trim();
      return pizzaName;
    } catch (error) {
      console.error('Error generating pizza name:', error);
      throw new Error('Failed to generate pizza name.');
    }
  }

  // Method to handle pizza name generation and save it
  async handlePizzaNameGeneration(ctx: Context) {
    const userId = ctx.message?.from.id;
    if (!userId) return;

    const userData = this.userGroupMap.get(userId);
    if (!userData) return;

    const { tg_first_name, pizza_topping, mafia_movie } = userData;

    if (!tg_first_name || !pizza_topping || !mafia_movie) {
      await ctx.reply('❌ Missing required information to generate a pizza name.');
      return;
    }

    // Select a random character from the mafia movie
    const mafiaCharacters = mafia_movie.split(',').map((char) => char.trim());
    const randomCharacter = mafiaCharacters[Math.floor(Math.random() * mafiaCharacters.length)];

    // Generate the pizza name
    const pizzaName = await this.generatePizzaName(tg_first_name, pizza_topping, randomCharacter);

    // Save the pizza name in the user data
    userData.pizza_name = pizzaName;

    // Display the pizza name to the user
    await ctx.reply(
      `🍕 Here's your AI-generated Pizza Name by Molto Benne:\n\n` + `Pizza Name: *${pizzaName}*`,
      {
        parse_mode: 'Markdown',
      },
    );
  }

  async handleRegionSelection(ctx: Context) {
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

  async handleCountrySelection(ctx: Context, regionId?: string) {
    if (!regionId) {
      return;
    }
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
    await ctx.deleteMessage();
    await ctx.sendMessage(
      '🌎 *Please select your country:*\n\n' +
        'Tap on one of the buttons below to choose your country\\.',
      {
        reply_markup: {
          inline_keyboard: [
            ...countryButtons,
            [{ text: '🔙 Back', callback_data: 'back_to_region' }],
          ],
        },
        parse_mode: 'MarkdownV2',
      },
    );
  }

  // Handle private chat messages
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
      await this.handleStartCommand(ctx);
    }

    if (!userData) return;

    if (step === 'discord_pizza_name') {
      if ('text' in ctx.message) {
        userData.pizza_name = ctx.message.text;
      } else {
        await ctx.reply('Invalid input. Please provide a valid pizza name.');
        return;
      }

      this.userSteps.set(userId, 'discord_username');
      await ctx.reply('What is your Discord Username?', {
        reply_markup: {
          force_reply: true,
        },
        parse_mode: 'MarkdownV2',
      });
    } else if (step === 'discord_username') {
      if ('text' in ctx.message) {
        userData.discord_name = ctx.message.text;
      } else {
        await ctx.reply('Invalid input. Please provide a valid Discord username.');
        return;
      }

      await this.handleNinjaTurtleMessage(ctx);
    } else if (step === 'pizza_topping') {
      if ('text' in ctx.message) {
        userData.pizza_topping = ctx.message.text;
      } else {
        await ctx.reply('Invalid input. Please provide a valid name.');
        return;
      }
      this.userSteps.set(userId, 'enter_mafia_movie');
      await ctx.reply('🎥 *What is your favorite Mafia movie?*', {
        reply_markup: {
          force_reply: true,
        },
        parse_mode: 'MarkdownV2',
      });
    } else if (step === 'enter_mafia_movie') {
      if ('text' in ctx.message) {
        userData.mafia_movie = ctx.message.text;
      } else {
        await ctx.reply('Invalid input. Please provide a valid topping name.');
        return;
      }

      await this.handlePizzaNameGeneration(ctx);
      await this.handleNinjaTurtleMessage(ctx);
    }
  }
}
