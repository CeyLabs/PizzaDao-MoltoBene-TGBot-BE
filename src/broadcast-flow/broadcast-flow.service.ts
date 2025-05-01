import { Injectable } from '@nestjs/common';
import { TelegramGroup } from './interfaces/telegram-group.interface';
import { dummyCityData, dummyGroups } from './data/dummy-data';
import { BroadcastMessage } from './interfaces/broadcast-message.interface';

@Injectable()
export class BroadcastFlowService {
  private groups: TelegramGroup[] = dummyGroups;
  private cityData = dummyCityData;

  getGroups(): TelegramGroup[] {
    return this.groups;
  }

  getGroupsByCity(city: string): TelegramGroup[] {
    return this.groups.filter((group) => group.city === city);
  }

  getAllCities(): string[] {
    return [...new Set(this.groups.map((group) => group.city))];
  }

  async broadcastMessage(message: BroadcastMessage, ctx: any): Promise<void> {
    let targetGroups: TelegramGroup[] = [];

    // Determine target groups based on scope
    if (message.scope === 'all') {
      targetGroups = this.groups;
    } else if (message.scope === 'city' && message.city) {
      targetGroups = this.getGroupsByCity(message.city);
    }

    if (targetGroups.length === 0) {
      await ctx.reply('No groups found for broadcasting.');
      return;
    }

    // Build the message text
    let messageText = message.content;

    if (message.city) {
      messageText = `📍 ${message.city}\n${messageText}`;
    }

    if (message.place) {
      messageText = `${messageText}\n🏢 Venue: ${message.place}`;
    }

    if (message.date) {
      messageText = `${messageText}\n📅 Date: ${message.date}`;
    }

    if (message.time) {
      messageText = `${messageText}\n⏰ Time: ${message.time}`;
    }

    if (message.externalLinks) {
      messageText = `${messageText}\n🔗 Links: ${message.externalLinks}`;
    }

    // Send the message to each group
    for (const group of targetGroups) {
      try {
        // Log for demonstration purposes (in a real app, this would send to actual groups)
        console.log(`Broadcasting to group: ${group.name} (${group.chatId})`);

        // Prepare message options
        const messageOptions: any = {};

        // Add inline keyboard if button exists
        if (message.buttonText && message.buttonUrl) {
          messageOptions.reply_markup = {
            inline_keyboard: [
              [{ text: message.buttonText, url: message.buttonUrl }],
            ],
          };
        }

        // Send message (with or without image)
        let sentMessage;

        if (message.image) {
          console.log(`Sending image message to ${group.name}`);
          // In a real scenario, you would use ctx.telegram.sendPhoto
          // sentMessage = await ctx.telegram.sendPhoto(group.chatId, message.image, {
          //   caption: messageText,
          //   ...messageOptions
          // });
        } else {
          console.log(`Sending text message to ${group.name}`);
          // In a real scenario, you would use ctx.telegram.sendMessage
          // sentMessage = await ctx.telegram.sendMessage(group.chatId, messageText, messageOptions);
        }

        // Pin message if requested
        if (message.pin) {
          console.log(`Pinning message in ${group.name}`);
          // In a real scenario, you would use ctx.telegram.pinChatMessage
          // await ctx.telegram.pinChatMessage(group.chatId, sentMessage.message_id);
        }
      } catch (error) {
        console.error(`Error broadcasting to group ${group.name}:`, error);
      }
    }

    await ctx.reply(`Message broadcasted to ${targetGroups.length} groups!`);
  }
}
