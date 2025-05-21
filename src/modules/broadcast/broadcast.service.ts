import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { Command, Ctx, On, Update } from 'nestjs-telegraf';
import { AccessService } from '../access/access.service';
import { InlineKeyboardButton, Message } from 'telegraf/typings/core/types/typegram';
import { UserAccessInfo, BroadcastSession, PostMessage } from './broadcast.type';
import { CommonService } from '../common/common.service';

@Update()
@Injectable()
export class BroadcastService {
  private readonly SUPER_ADMIN_ID = process.env.ADMIN_ID;

  constructor(
    private readonly accessService: AccessService,
    @Inject(forwardRef(() => CommonService))
    private readonly commonService: CommonService,
  ) {}

  @Command('broadcast')
  async onBroadcast(@Ctx() ctx: Context) {
    if (!ctx.from?.id) {
      await ctx.reply(this.escapeMarkdown('❌ User ID is undefined.'), {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    const accessRole = await this.accessService.getAccessRole(String(ctx.from.id));
    if (!accessRole || accessRole === 'no access') {
      await ctx.reply(this.escapeMarkdown('❌ You do not have access to broadcast messages.'), {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    await this.showBroadcastMenu(ctx, accessRole);
  }

  private async showBroadcastMenu(ctx: Context, role: string) {
    try {
      const rawMessage = `Hello there *${role.charAt(0).toUpperCase() + role.slice(1)}* 👋
Here you can create rich posts, set Variables and Invite new Admins

Current Variables:
- City: Galle
- Country: Sri Lanka
- Date: 22nd May 2025
- Start Time: 06:00 PM
- End Time: 09:00 PM
- Venue: Pizza Den
- Venue Link: https://t.co/sSsfnwwhAd
- Unlock Link: https://app.unlock-protocol.com/event/global-pizza-party-kandy-1
- X Post: https://x.com/pizzadao/fsda
- Admins: @naveensavishka`;

      await ctx.reply(this.escapeMarkdown(rawMessage), {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Create Post', callback_data: 'create_post' },
              { text: 'Update Variables', callback_data: 'update_variables' },
            ],
            [{ text: 'Invite new Admin', callback_data: 'invite_admin' }],
          ],
        },
      });
    } catch {
      await ctx.reply(this.escapeMarkdown('❌ Failed to display post creation interface.'), {
        parse_mode: 'MarkdownV2',
      });
    }
  }

  async handleCallbackQuery(ctx: Context) {
    const callbackData =
      ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;

    if (!callbackData || !ctx.from?.id) {
      await ctx.answerCbQuery(this.escapeMarkdown('❌ Invalid callback or user ID'));
      return;
    }

    if (callbackData === 'create_post') {
      await this.handleCreatePost(ctx);
      return;
    }

    if (callbackData.startsWith('broadcast_')) {
      await this.handleBroadcastSelection(ctx, callbackData);
      return;
    }

    if (
      callbackData === 'host_specific_city' ||
      callbackData === 'host_specific_country' ||
      callbackData === 'host_create_post'
    ) {
      const buttonNameMap: Record<string, string> = {
        host_specific_city: 'Specific City',
        host_specific_country: 'Specific Country',
        host_create_post: 'Create post',
      };
      await ctx.answerCbQuery(
        this.escapeMarkdown(`You clicked on ${buttonNameMap[callbackData] || 'Unknown button'}`),
      );
      if (callbackData === 'host_create_post') {
        await this.onCreatePost(ctx);
      }
      return;
    }

    if (callbackData.startsWith('msg_')) {
      await this.handleMessageAction(ctx, callbackData);
      return;
    }

    await ctx.answerCbQuery();
  }

  private async getUserAccessInfo(ctx: Context): Promise<UserAccessInfo | null> {
    if (!ctx.from?.id) {
      await ctx.reply(this.escapeMarkdown('❌ User ID is undefined.'), {
        parse_mode: 'MarkdownV2',
      });
      return null;
    }

    const userId = ctx.from.id;
    const userAccess = await this.accessService.getUserAccess(String(userId));
    if (userAccess === 'no access') {
      await ctx.reply(this.escapeMarkdown('❌ You do not have access to broadcast messages.'), {
        parse_mode: 'MarkdownV2',
      });
      return null;
    }

    const role = userId.toString() === this.SUPER_ADMIN_ID ? 'admin' : userAccess[0].role;
    return { userAccess, role, userId };
  }

  private async handleCreatePost(ctx: Context) {
    const accessInfo = await this.getUserAccessInfo(ctx);
    if (!accessInfo) return;

    const { userAccess, role } = accessInfo;

    await ctx.deleteMessage().catch(() => {});

    let message: string;
    let inline_keyboard: InlineKeyboardButton[][] = [];

    switch (role) {
      case 'admin':
        message = `You're assigned as *Super Admin* to all the Pizza DAO chats. Select a Specific Group(s) to send the Broadcast Message.`;
        inline_keyboard = [
          [
            { text: '🌍 All City Chats', callback_data: 'broadcast_all_cities' },
            { text: '🏙️ Specific City', callback_data: 'broadcast_specific_city' },
          ],
          [
            { text: '📍 Specific Region', callback_data: 'broadcast_specific_region' },
            { text: '🌐 Specific Country', callback_data: 'broadcast_specific_country' },
          ],
        ];
        break;

      case 'underboss': {
        const regionName =
          Array.isArray(userAccess) && userAccess[0]?.region_name ? userAccess[0].region_name : '';
        message = `You're assigned as *Underboss* to all the *${this.escapeMarkdown(regionName)}* Pizza DAO chats. Select a Specific Group(s) to send the Broadcast Message.`;
        inline_keyboard = [
          [
            { text: '🏙️ Specific City', callback_data: 'broadcast_underboss_city' },
            { text: '🌐 Specific Country', callback_data: 'broadcast_underboss_country' },
          ],
          [
            {
              text: `All City Chats in ${regionName}`,
              callback_data: 'broadcast_all_region_cities',
            },
          ],
        ];
        break;
      }

      case 'host': {
        const cityName =
          (Array.isArray(userAccess) && userAccess[0]?.city_data?.[0]?.city_name) || '';
        message = `You're assigned as Host to *"${this.escapeMarkdown(cityName || 'Unknown City')} Pizza DAO"* chat. Select an option below
\nSend me one or multiple messages you want to include in the post. It can be anything — a text, photo, video, even a sticker.`;
        break;
      }

      case 'caporegime': {
        const countryName = (Array.isArray(userAccess) && userAccess[0]?.country_name) || '';
        message = `You're assigned as *Caporegime* to all the *${this.escapeMarkdown(countryName || 'Unknown Country')}* Pizza DAO chats. Select a Specific Group(s) to send the Broadcast Message.`;
        inline_keyboard = [
          [
            { text: '🏙️ Specific City', callback_data: 'broadcast_caporegime_city' },
            { text: '🌐 Specific Country', callback_data: 'broadcast_caporegime_country' },
          ],
          [
            {
              text: `All City Chats in ${countryName}`,
              callback_data: 'broadcast_all_caporegime_cities',
            },
          ],
        ];
        break;
      }

      default:
        await ctx.reply(this.escapeMarkdown('❌ You do not have access to broadcast messages.'), {
          parse_mode: 'MarkdownV2',
        });
        return;
    }

    await ctx.reply(this.escapeMarkdown(message), {
      parse_mode: 'MarkdownV2',
      ...(inline_keyboard.length > 0 && {
        reply_markup: { inline_keyboard },
      }),
    });
  }

  private async handleBroadcastSelection(ctx: Context, callbackData: string) {
    try {
      if (!ctx.from?.id) {
        await ctx.answerCbQuery(this.escapeMarkdown('❌ User ID not found'));
        return;
      }

      const userId = ctx.from.id;
      const actionMap: Record<string, string> = {
        broadcast_all_cities: 'All City Chats',
        broadcast_specific_city: 'Specific City',
        broadcast_specific_region: 'Specific Region',
        broadcast_specific_country: 'Specific Country',
        broadcast_underboss_city: 'Underboss City',
        broadcast_underboss_country: 'Underboss Country',
        broadcast_all_region_cities: 'All Region Cities',
        broadcast_caporegime_city: 'Caporegime City',
        broadcast_caporegime_country: 'Caporegime Country',
        broadcast_all_caporegime_cities: 'All Caporegime Cities',
      };

      await ctx.answerCbQuery(
        this.escapeMarkdown(`Selected: ${actionMap[callbackData] || 'Unknown action'}`),
      );

      if (callbackData === 'broadcast_all_cities') {
        this.commonService.setUserState(Number(userId), {
          flow: 'broadcast',
          step: `creating_post`,
          messages: [] as PostMessage[],
        });

        await ctx.reply(
          this.escapeMarkdown(
            `📢 You're assigned as admin to *All Pizza DAO* chats.\n\n` +
              `Send me one or multiple messages you want to include in the post. It can be anything — a text, photo, video, even a sticker.\n\n` +
              `You can use variables with below format within curly brackets.\n\n` +
              `*Eg:*\n` +
              `Hello {city} Pizza DAO members,\n` +
              `We have Upcoming Pizza Day on {venue} at {time} .\n\n` +
              `You can register via - {unlock_link}`,
          ),
          {
            parse_mode: 'MarkdownV2',
            reply_markup: this.getKeyboardMarkup(),
          },
        );
      }
    } catch {
      await ctx.answerCbQuery(this.escapeMarkdown('❌ Error processing your request'));
    }
  }

  private getKeyboardMarkup() {
    return {
      keyboard: [
        [{ text: 'Delete All' }, { text: 'Preview' }],
        [{ text: 'Cancel' }, { text: 'Send' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    };
  }

  private async handleMessageAction(ctx: Context, callbackData: string) {
    if (!ctx.from?.id) {
      await ctx.answerCbQuery(this.escapeMarkdown('❌ User ID not found'));
      return;
    }

    const userId = ctx.from.id;
    const session = this.commonService.getUserState(userId);
    if (!session) {
      await ctx.answerCbQuery(this.escapeMarkdown('❌ No active session found.'));
      return;
    }
    session.messages = session.messages || [];

    const [action, messageIndexStr] = callbackData.split('_').slice(1);
    const index = parseInt(messageIndexStr, 10);

    if (isNaN(index) || index < 0 || index >= session.messages.length) {
      await ctx.answerCbQuery(this.escapeMarkdown('❌ Invalid message index'));
      return;
    }

    switch (action) {
      case 'media':
        this.commonService.setUserState(userId, {
          currentAction: 'attach_media',
          currentMessageIndex: index,
        });

        await ctx.reply(this.escapeMarkdown('Send me an image, GIF, or video (up to 5 MB).'), {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getCancelKeyboard(),
        });
        break;

      case 'url':
        this.commonService.setUserState(userId, {
          currentAction: 'add_url_buttons',
          currentMessageIndex: index,
        });

        await ctx.reply(
          this.escapeMarkdown(
            'Send me a list of URL buttons for the message. Please use this format:\n\n' +
              'Button text 1 - http://www.example.com/ |\n' +
              'Button text 2 - http://www.example2.com/ |\n' +
              'Button text 3 - http://www.example3.com/\n\n' +
              "Choose 'Cancel' to go back to creating the post.",
          ),
          {
            parse_mode: 'MarkdownV2',
            reply_markup: this.getCancelKeyboard(),
          },
        );
        break;

      case 'pin': {
        const selectedMessage = session.messages[index] as PostMessage;
        selectedMessage.isPinned = !selectedMessage.isPinned;
        this.commonService.setUserState(userId, {
          ...session,
          step: 'creating_post',
          messages: session.messages ?? [],
        });

        await ctx.answerCbQuery(
          this.escapeMarkdown(`Message pin status: ${selectedMessage.isPinned ? 'ON' : 'OFF'}`),
        );
        await this.displayMessageWithActions(ctx, index, selectedMessage);
        break;
      }

      case 'delete':
        session.messages.splice(index, 1);
        this.commonService.setUserState(userId, session);

        await ctx.answerCbQuery(this.escapeMarkdown('Message deleted'));
        await ctx.deleteMessage().catch(() => {});
        await ctx.reply(this.escapeMarkdown('✅ Message deleted successfully.'), {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        });
        break;
    }
  }

  private getCancelKeyboard() {
    return {
      keyboard: [[{ text: 'Cancel' }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    };
  }

  private async handlePostActions(ctx: Context, action: string) {
    if (!ctx.from?.id) return;

    const userId = ctx.from.id;
    const session = this.commonService.getUserState(userId);
    if (!session || !session.messages) {
      await ctx.reply(this.escapeMarkdown('❌ No messages to process.'), {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    if (session.messages.length === 0 && action !== 'Cancel') {
      await ctx.reply(this.escapeMarkdown('❌ No messages to process.'), {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    switch (action) {
      case 'Preview':
        await this.previewMessages(ctx, session as BroadcastSession);
        break;

      case 'Send':
        await this.sendMessages(ctx, session as BroadcastSession);
        break;

      case 'Delete All':
        this.commonService.setUserState(userId, {
          ...session,
          step: 'creating_post',
          messages: [],
        });
        await ctx.reply(this.escapeMarkdown('✅ All messages have been deleted.'), {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        });
        break;

      case 'Cancel':
        this.commonService.clearUserState(userId);
        await ctx.reply(this.escapeMarkdown('✅ Broadcast session cancelled.'), {
          parse_mode: 'MarkdownV2',
          reply_markup: { remove_keyboard: true },
        });
        break;
    }
  }

  private async previewMessages(ctx: Context, session: BroadcastSession) {
    try {
      const accessInfo = await this.getUserAccessInfo(ctx);
      if (!accessInfo) return;

      const { userAccess } = accessInfo;
      let cityData: {
        city_name: string;
        group_id?: string | null;
        telegram_link?: string | null;
      }[] = [];

      if (Array.isArray(userAccess)) {
        cityData = userAccess
          .flatMap((access) => access.city_data || [])
          .map((city: { city_name: string; group_id?: string | null }) => ({
            city_name: city.city_name,
            group_id: city.group_id,
          }));
      } else if (userAccess !== 'no access') {
        cityData = userAccess.city_data.map((city) => ({
          city_name: city.city_name,
          group_id: city.group_id,
          telegram_link: city.telegram_link,
        }));
      }

      if (cityData.length === 0) {
        await ctx.reply('❌ No cities found in your access data.', {
          parse_mode: 'MarkdownV2',
        });
        return;
      }

      const previewCity = cityData[0];
      await ctx.reply(`🔍 *Preview for ${previewCity.city_name}:*`, {
        parse_mode: 'MarkdownV2',
      });

      for (const [index, message] of session.messages.entries()) {
        const processedText = message.text?.replace(/{city}/gi, previewCity.city_name);

        const urlButtons: InlineKeyboardButton[][] = message.urlButtons.map((btn) => [
          { text: btn.text, url: btn.url },
        ]);

        const inlineKeyboard: InlineKeyboardButton[][] = [
          ...urlButtons,
          [
            { text: 'Attach Media', callback_data: `msg_media_${index}` },
            { text: 'Add URL Buttons', callback_data: `msg_url_${index}` },
          ],
          [
            {
              text: `Pin the Message: ${message.isPinned ? 'ON' : 'OFF'}`,
              callback_data: `msg_pin_${index}`,
            },
          ],
          [{ text: 'Delete Message', callback_data: `msg_delete_${index}` }],
        ];

        if (message.mediaType && message.mediaUrl) {
          const caption = this.escapeMarkdown(processedText ?? '');
          const replyMarkup = { inline_keyboard: inlineKeyboard };
          let receivedMessage;

          switch (message.mediaType) {
            case 'photo':
              if (!ctx.chat?.id) {
                throw new Error('Chat ID is undefined');
              }
              receivedMessage = await ctx.telegram.sendPhoto(ctx.chat.id, message.mediaUrl, {
                caption,
                parse_mode: 'MarkdownV2',
                reply_markup: replyMarkup,
              });
              break;
            case 'video':
              if (!ctx.chat?.id) {
                throw new Error('Chat ID is undefined');
              }
              receivedMessage = await ctx.telegram.sendVideo(ctx.chat.id, message.mediaUrl, {
                caption,
                parse_mode: 'MarkdownV2',
                reply_markup: replyMarkup,
              });
              break;
            case 'document':
              if (!ctx.chat?.id) {
                throw new Error('Chat ID is undefined');
              }
              receivedMessage = await ctx.telegram.sendDocument(ctx.chat.id, message.mediaUrl, {
                caption,
                parse_mode: 'MarkdownV2',
                reply_markup: replyMarkup,
              });
              break;
            case 'animation':
              receivedMessage = await ctx.telegram.sendAnimation(
                ctx.chat?.id ?? 0,
                message.mediaUrl,
                {
                  caption,
                  parse_mode: 'MarkdownV2',
                  reply_markup: replyMarkup,
                },
              );
              break;
          }
          if (receivedMessage && 'message_id' in receivedMessage) {
            message.messageId = (receivedMessage as { message_id: number }).message_id;
          }
        } else {
          const sentMessage = await ctx.telegram.sendMessage(
            ctx.chat?.id ??
              (() => {
                throw new Error('Chat ID is undefined');
              })(),
            this.escapeMarkdown(processedText ?? ''),
            {
              parse_mode: 'MarkdownV2',
              reply_markup: { inline_keyboard: inlineKeyboard },
            },
          );
          message.messageId = sentMessage.message_id;
        }

        session.messages[index] = message;
        if (ctx.from?.id) {
          this.commonService.setUserState(ctx.from.id, { ...session });
        }
      }

      await ctx.reply(
        `This post will be sent to *${cityData.length} cities*\\. Use the Send button to distribute it\\.\n\nNOTE: This is just a preview using ${previewCity.city_name} as an example city\\. The actual messages will have the appropriate city name for each group\\.`,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        },
      );
    } catch {
      await ctx.reply(this.escapeMarkdown('❌ Error generating preview. Please try again.'), {
        parse_mode: 'MarkdownV2',
      });
    }
  }

  private async sendMessages(ctx: Context, session: BroadcastSession) {
    try {
      const accessInfo = await this.getUserAccessInfo(ctx);
      if (!accessInfo) return;

      const { userAccess } = accessInfo;
      let cityData: {
        city_name: string;
        group_id?: string | null;
        telegram_link?: string | null;
      }[] = [];

      if (Array.isArray(userAccess)) {
        cityData = userAccess
          .flatMap((access) => access.city_data || [])
          .map((city: { city_name: string; group_id?: string | null }) => ({
            city_name: city.city_name,
            group_id: city.group_id,
          }));
      } else if (userAccess !== 'no access') {
        cityData = userAccess.city_data.map((city) => ({
          city_name: city.city_name,
          group_id: city.group_id,
          telegram_link: city.telegram_link,
        }));
      }

      if (cityData.length === 0) {
        await ctx.reply(this.escapeMarkdown('❌ No cities found in your access data.'), {
          parse_mode: 'MarkdownV2',
        });
        return;
      }

      await ctx.reply(
        this.escapeMarkdown(`🚀 Starting to send messages to ${cityData.length} cities...`),
        {
          parse_mode: 'MarkdownV2',
        },
      );

      let successCount = 0;
      let failureCount = 0;
      let progressMsgId: number | undefined = undefined;

      for (let i = 0; i < cityData.length; i++) {
        const city = cityData[i];
        console.log('😼 meow!!');
        try {
          for (const message of session.messages) {
            const processedText = message.text?.replace(/{city}/gi, city.city_name);

            const urlButtons: InlineKeyboardButton[][] = message.urlButtons.map((btn) => [
              { text: btn.text, url: btn.url },
            ]);

            const replyMarkup = urlButtons.length > 0 ? { inline_keyboard: urlButtons } : undefined;

            let sentMessage: Message;

            // Simulate sending (replace with actual Telegram API call to group_id)
            if (message.mediaType && message.mediaUrl) {
              switch (message.mediaType) {
                case 'photo':
                  sentMessage = await ctx.telegram.sendPhoto(
                    (city.group_id || ctx.chat?.id) ?? 0,
                    message.mediaUrl,
                    {
                      caption: this.escapeMarkdown(processedText ?? ''),
                      parse_mode: 'MarkdownV2',
                      reply_markup: replyMarkup,
                    },
                  );
                  break;
                case 'video':
                  sentMessage = await ctx.telegram.sendVideo(
                    (city.group_id || ctx.chat?.id) ?? 0,
                    message.mediaUrl,
                    {
                      caption: this.escapeMarkdown(processedText ?? ''),
                      parse_mode: 'MarkdownV2',
                      reply_markup: replyMarkup,
                    },
                  );
                  break;
                case 'document':
                  sentMessage = await ctx.telegram.sendDocument(
                    (city.group_id || ctx.chat?.id) ?? 0,
                    message.mediaUrl,
                    {
                      caption: this.escapeMarkdown(processedText ?? ''),
                      parse_mode: 'MarkdownV2',
                      reply_markup: replyMarkup,
                    },
                  );
                  break;
                case 'animation':
                  sentMessage = await ctx.telegram.sendAnimation(
                    (city.group_id || ctx.chat?.id) ?? 0,
                    message.mediaUrl,
                    {
                      caption: this.escapeMarkdown(processedText ?? ''),
                      parse_mode: 'MarkdownV2',
                      reply_markup: replyMarkup,
                    },
                  );
                  break;
              }
            } else {
              sentMessage = await ctx.telegram.sendMessage(
                (city.group_id || ctx.chat?.id) ?? 0,
                this.escapeMarkdown(processedText ?? ''),
                {
                  parse_mode: 'MarkdownV2',
                  reply_markup: replyMarkup,
                },
              );
            }

            if (message.isPinned) {
              await ctx.telegram.pinChatMessage(
                (city.group_id || ctx.chat?.id) ?? 0,
                sentMessage.message_id ?? 0,
                {
                  disable_notification: true,
                },
              );
            }

            successCount++;
          }
        } catch (error) {
          failureCount++;
          console.log(`Error sending to ${city.city_name}:`, error);
        }

        // Progress update every 10 cities or at the end
        if ((i + 1) % 10 === 0 || i === cityData.length - 1) {
          const progressText = this.escapeMarkdown(
            `📊 Progress: ${i + 1}/${cityData.length} cities\n` +
              `✅ Success: ${successCount}\n❌ Failed: ${failureCount}`,
          );
          if (progressMsgId) {
            try {
              await ctx.telegram.editMessageText(
                ctx.chat?.id ?? 0,
                progressMsgId,
                undefined,
                progressText,
                { parse_mode: 'MarkdownV2' },
              );
            } catch {
              // If edit fails (e.g., message deleted), send a new one
              const sent = await ctx.reply(progressText, { parse_mode: 'MarkdownV2' });
              if ('message_id' in sent) {
                progressMsgId = sent.message_id;
              }
            }
          } else {
            const sent = await ctx.reply(progressText, { parse_mode: 'MarkdownV2' });
            if ('message_id' in sent) {
              progressMsgId = sent.message_id;
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await ctx.reply(
        this.escapeMarkdown(
          `✅ Broadcast completed!\n\n` +
            `📊 Summary:\n` +
            `- Successfully sent to ${successCount} cities\n` +
            `- Failed to send to ${failureCount} cities\n\n` +
            `Check the logs for details.`,
        ),
        {
          parse_mode: 'MarkdownV2',
          reply_markup: { remove_keyboard: true },
        },
      );

      if (accessInfo.userId !== undefined) {
        this.commonService.clearUserState(accessInfo.userId);
      }
    } catch {
      await ctx.reply(
        this.escapeMarkdown('❌ Error sending messages. Please check the logs and try again.'),
        {
          parse_mode: 'MarkdownV2',
        },
      );
    }
  }

  async handleBroadcatsMessages(ctx: Context) {
    if (!ctx.from?.id || !ctx.message || !('text' in ctx.message)) return;

    const userId = ctx.from.id;
    const text = ctx.message.text;
    const session = this.commonService.getUserState(userId);

    if (!session || session.step !== 'creating_post') return;

    if (text === 'Cancel') {
      if (session.currentAction) {
        session.currentAction = undefined;
        session.currentMessageIndex = undefined;
        session.step = session.step ?? 'creating_post';
        this.commonService.setUserState(userId, session);
        await ctx.reply(this.escapeMarkdown('✅ Action cancelled.'), {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        });
      } else {
        await this.handlePostActions(ctx, 'Cancel');
      }
      return;
    }

    if (['Delete All', 'Preview', 'Send'].includes(text)) {
      await this.handlePostActions(ctx, text);
      return;
    }

    if (session.currentAction === 'add_url_buttons' && session.currentMessageIndex !== undefined) {
      const buttons = this.parseUrlButtons(text);
      if (
        buttons.length > 0 &&
        typeof session.currentMessageIndex === 'number' &&
        session.currentMessageIndex >= 0 &&
        session.messages &&
        session.currentMessageIndex < session.messages.length
      ) {
        (session.messages[session.currentMessageIndex] as PostMessage).urlButtons = buttons;
        this.commonService.setUserState(userId, session);

        await ctx.reply(this.escapeMarkdown('✅ URL buttons added to your message.'), {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        });

        if (
          Array.isArray(session.messages) &&
          typeof session.currentMessageIndex === 'number' &&
          session.currentMessageIndex >= 0 &&
          session.currentMessageIndex < session.messages.length
        ) {
          await this.displayMessageWithActions(
            ctx,
            session.currentMessageIndex,
            session.messages[session.currentMessageIndex] as PostMessage,
          );
        }

        session.currentAction = undefined;
        session.currentMessageIndex = undefined;
        session.step = session.step ?? 'creating_post';
        this.commonService.setUserState(userId, session);
      } else {
        await ctx.reply(
          this.escapeMarkdown('❌ Invalid URL button format or message index. Please try again.'),
          {
            parse_mode: 'MarkdownV2',
            reply_markup: this.getCancelKeyboard(),
          },
        );
      }
      return;
    }

    try {
      const messageObj: PostMessage = {
        text,
        isPinned: false,
        urlButtons: [],
        mediaUrl: null,
        mediaType: undefined,
        messageId: undefined,
      };

      if (!session.messages) {
        session.messages = [];
      }
      session.messages.push(messageObj);
      this.commonService.setUserState(userId, {
        ...session,
        step: session.step ?? 'creating_post',
      });

      const messageIndex = session.messages.length - 1;
      await this.displayMessageWithActions(ctx, messageIndex, messageObj);
    } catch {
      await ctx.reply(this.escapeMarkdown('❌ Error processing your message. Please try again.'), {
        parse_mode: 'MarkdownV2',
      });
    }
  }

  private async displayMessageWithActions(ctx: Context, index: number, messageObj: PostMessage) {
    try {
      const chatId = ctx.chat?.id;
      if (!chatId) {
        throw new Error('Chat ID not found');
      }

      if (messageObj.messageId) {
        await ctx.telegram.deleteMessage(chatId, messageObj.messageId).catch(() => {});
      }

      const inlineKeyboard: InlineKeyboardButton[][] = [
        ...messageObj.urlButtons.map((btn) => [{ text: btn.text, url: btn.url }]),
        [
          { text: 'Attach Media', callback_data: `msg_media_${index}` },
          { text: 'Add URL Buttons', callback_data: `msg_url_${index}` },
        ],
        [
          {
            text: `Pin the Message: ${messageObj.isPinned ? 'ON' : 'OFF'}`,
            callback_data: `msg_pin_${index}`,
          },
        ],
        [{ text: 'Delete Message', callback_data: `msg_delete_${index}` }],
      ];

      let sentMessage;
      if (messageObj.mediaType && messageObj.mediaUrl) {
        const caption = this.escapeMarkdown(messageObj.text ?? '');
        const replyMarkup = { inline_keyboard: inlineKeyboard };

        switch (messageObj.mediaType) {
          case 'photo':
            sentMessage = await ctx.telegram.sendPhoto(chatId, messageObj.mediaUrl, {
              caption,
              parse_mode: 'MarkdownV2',
              reply_markup: replyMarkup,
            });
            break;
          case 'video':
            sentMessage = await ctx.telegram.sendVideo(chatId, messageObj.mediaUrl, {
              caption,
              parse_mode: 'MarkdownV2',
              reply_markup: replyMarkup,
            });
            break;
          case 'document':
            sentMessage = await ctx.telegram.sendDocument(chatId, messageObj.mediaUrl, {
              caption,
              parse_mode: 'MarkdownV2',
              reply_markup: replyMarkup,
            });
            break;
          case 'animation':
            sentMessage = await ctx.telegram.sendAnimation(chatId, messageObj.mediaUrl, {
              caption,
              parse_mode: 'MarkdownV2',
              reply_markup: replyMarkup,
            });
            break;
        }
      } else {
        sentMessage = await ctx.telegram.sendMessage(
          chatId,
          this.escapeMarkdown(messageObj.text ?? ''),
          {
            parse_mode: 'MarkdownV2',
            reply_markup: { inline_keyboard: inlineKeyboard },
          },
        );
      }

      if (sentMessage && 'message_id' in sentMessage) {
        messageObj.messageId = (sentMessage as { message_id: number }).message_id;
      }
      const userId = ctx.from?.id;
      if (userId) {
        const session = this.commonService.getUserState(userId);
        if (session?.messages) {
          session.messages[index] = messageObj;
          this.commonService.setUserState(userId, session);
        }
      }

      await ctx.reply(
        this.escapeMarkdown('Please continue adding messages or use the keyboard options below.'),
        {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        },
      );
    } catch {
      await ctx.reply(this.escapeMarkdown('❌ Error displaying message. Please try again.'), {
        parse_mode: 'MarkdownV2',
      });
    }
  }

  private parseUrlButtons(text: string): { text: string; url: string }[] {
    const buttons: { text: string; url: string }[] = [];
    const buttonTexts = text
      .split(/[\n|]+/)
      .map((line) => line.trim())
      .filter((line) => line);

    for (const buttonText of buttonTexts) {
      const match = buttonText.match(/^(.*?)\s*-\s*(https?:\/\/.*)$/i);
      if (match && match.length === 3) {
        const [, text, url] = match;
        try {
          new URL(url);
          buttons.push({ text: text.trim(), url: url.trim() });
        } catch {
          // Invalid URL, do not add to buttons
        }
      }
    }
    return buttons;
  }

  async onCreatePost(@Ctx() ctx: Context) {
    try {
      await ctx.reply(
        this.escapeMarkdown(
          "📝 Let's create a new post! Please send me the message you want to broadcast.",
        ),
        {
          parse_mode: 'MarkdownV2',
          reply_markup: this.getKeyboardMarkup(),
        },
      );
    } catch {
      await ctx.reply(this.escapeMarkdown('❌ Failed to start post creation. Please try again.'), {
        parse_mode: 'MarkdownV2',
      });
    }
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: Context) {
    await this.handleMedia(ctx, 'photo');
  }

  @On('video')
  async onVideo(@Ctx() ctx: Context) {
    await this.handleMedia(ctx, 'video');
  }

  @On('document')
  async onDocument(@Ctx() ctx: Context) {
    await this.handleMedia(ctx, 'document');
  }

  @On('animation')
  async onAnimation(@Ctx() ctx: Context) {
    await this.handleMedia(ctx, 'animation');
  }

  private async handleMedia(ctx: Context, mediaType: 'photo' | 'video' | 'document' | 'animation') {
    if (!ctx.from?.id) return;

    const userId = ctx.from.id;
    const session = this.commonService.getUserState(userId);
    if (!session || session.step !== 'creating_post') return;

    let fileId: string | undefined;
    let text: string | null = null;

    if (
      mediaType === 'photo' &&
      ctx.message &&
      'photo' in ctx.message &&
      ctx.message.photo.length > 0
    ) {
      fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      if ('caption' in ctx.message && ctx.message.caption) {
        text = ctx.message.caption;
      }
    } else if (mediaType === 'video' && ctx.message && 'video' in ctx.message) {
      fileId = ctx.message.video.file_id;
      if ('caption' in ctx.message && ctx.message.caption) {
        text = ctx.message.caption;
      }
    } else if (mediaType === 'document' && ctx.message && 'document' in ctx.message) {
      fileId = ctx.message.document.file_id;
      if ('caption' in ctx.message && ctx.message.caption) {
        text = ctx.message.caption;
      }
    } else if (mediaType === 'animation' && ctx.message && 'animation' in ctx.message) {
      fileId = ctx.message.animation.file_id;
      if ('caption' in ctx.message && ctx.message.caption) {
        text = ctx.message.caption;
      }
    }

    if (!fileId) {
      await ctx.reply(this.escapeMarkdown('❌ Could not process the media. Please try again.'), {
        parse_mode: 'MarkdownV2',
      });
      return;
    }

    try {
      if (session.currentAction === 'attach_media' && session.currentMessageIndex !== undefined) {
        if (
          typeof session.currentMessageIndex === 'number' &&
          session.currentMessageIndex >= 0 &&
          session.messages &&
          session.currentMessageIndex < session.messages.length
        ) {
          const msg = session.messages[session.currentMessageIndex] as PostMessage;
          msg.mediaUrl = fileId;
          msg.mediaType = mediaType;
          msg.text = text || msg.text;
        } else {
          await ctx.reply(this.escapeMarkdown('❌ Invalid message index for attaching media.'), {
            parse_mode: 'MarkdownV2',
          });
          return;
        }

        await ctx.reply(
          this.escapeMarkdown(
            `✅ ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} attached to your message.`,
          ),
          {
            parse_mode: 'MarkdownV2',
            reply_markup: this.getKeyboardMarkup(),
          },
        );

        await this.displayMessageWithActions(
          ctx,
          session.currentMessageIndex,
          session.messages[session.currentMessageIndex] as PostMessage,
        );

        session.currentAction = undefined;
        session.currentMessageIndex = undefined;
        this.commonService.setUserState(userId, session);
      } else {
        const messageObj: PostMessage = {
          text,
          isPinned: false,
          urlButtons: [],
          mediaUrl: fileId,
          mediaType,
          messageId: undefined,
        };

        if (!session.messages) {
          session.messages = [];
        }
        session.messages.push(messageObj);
        this.commonService.setUserState(userId, session);

        const messageIndex = session.messages.length - 1;
        await ctx.reply(
          this.escapeMarkdown(
            `✅ ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} added to your post.`,
          ),
          {
            parse_mode: 'MarkdownV2',
            reply_markup: this.getKeyboardMarkup(),
          },
        );

        await this.displayMessageWithActions(ctx, messageIndex, messageObj);
      }
    } catch {
      await ctx.reply(this.escapeMarkdown(`❌ Error processing ${mediaType}. Please try again.`), {
        parse_mode: 'MarkdownV2',
      });
    }
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
  }
}
