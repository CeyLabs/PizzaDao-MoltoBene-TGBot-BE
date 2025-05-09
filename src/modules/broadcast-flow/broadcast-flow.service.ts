import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { BroadcastMessage, BroadcastResult } from './broadcast-flow.interface';
import { CityService } from '../city/city.service';

@Injectable()
export class BroadcastFlowService {
  private readonly logger = new Logger(BroadcastFlowService.name);

  constructor(
    @InjectBot() private bot: Telegraf<Context>,
    private readonly cityService: CityService,
  ) {}

  async broadcastMessage(message: BroadcastMessage, ctx: Context): Promise<BroadcastResult> {
    let targetGroups: { group_id: string; name: string }[] = [];
    const userId = ctx.from?.id ?? null;

    this.logger.log(`Broadcasting message by user ID: ${userId}`);

    try {
      // Determine target groups based on scope and permissions
      if (message.scope === 'all') {
        targetGroups = await this.cityService.getAllCitiesWithGroups();
      } else if (message.scope === 'city' && message.city) {
        // Check if user has admin rights for this city
        targetGroups = await this.cityService.getGroupsByCity(message.city);
      }

      if (targetGroups.length === 0) {
        return {
          success: false,
          message: 'No groups found for broadcasting.',
          groupCount: 0,
        };
      }

      this.logger.log(
        `Found ${targetGroups.length} target groups for broadcasting: ${targetGroups.map((g) => g.name).join(', ')}`,
      );

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
      const successfulGroups: string[] = [];
      const failedGroups: string[] = [];
      const errorDetails: Record<string, string> = {};

      let sentMessage: { message_id: number } | undefined;

      for (const group of targetGroups) {
        try {
          if (!group.group_id) {
            this.logger.warn(`Skipping group ${group.name} due to missing chatId.`);
            failedGroups.push(group.name);
            errorDetails[group.name] = 'Missing chatId';
            continue;
          }

          this.logger.log(`Broadcasting to group: ${group.name} (${group.group_id})`);

          // Prepare message options
          const messageOptions: {
            parse_mode: 'Markdown' | 'HTML';
            reply_markup?: {
              inline_keyboard: { text: string; url: string }[][];
            };
          } = {
            parse_mode: 'Markdown',
          };

          // Add inline keyboard if button exists
          if (message.buttonText && message.buttonUrl) {
            messageOptions.reply_markup = {
              inline_keyboard: [[{ text: message.buttonText, url: message.buttonUrl }]],
            };
          }

          // Send message (with or without image)
          if (message.image) {
            this.logger.log(`Sending image message to ${group.name}`);

            try {
              sentMessage = await ctx.telegram.sendPhoto(group.group_id, message.image, {
                caption: messageText,
                parse_mode: messageOptions.parse_mode,
                reply_markup: messageOptions.reply_markup,
              });
              successfulGroups.push(group.name);
              this.logger.log(`Successfully sent image message to ${group.name}`);
            } catch (error) {
              this.logger.error(
                `Error sending photo to ${group.name}: ${(error as Error).message || 'Unknown error'}`,
              );
              failedGroups.push(group.name);
              errorDetails[group.name] = (error as Error).message || 'Unknown error';
              continue;
            }
          } else {
            this.logger.log(`Sending text message to ${group.name}`);

            try {
              sentMessage = await ctx.telegram.sendMessage(
                group.group_id,
                messageText,
                messageOptions,
              );
              successfulGroups.push(group.name);
              this.logger.log(`Successfully sent text message to ${group.name}`);
            } catch (error) {
              this.logger.error(
                `Error sending message to ${group.name}: ${(error as Error).message || 'Unknown error'}`,
              );
              failedGroups.push(group.name);
              errorDetails[group.name] = (error as Error).message || 'Unknown error';
              continue;
            }
          }

          // Pin message if requested
          if (message.pin && sentMessage) {
            this.logger.log(`Pinning message in ${group.name}`);

            try {
              await ctx.telegram.pinChatMessage(group.group_id, sentMessage?.message_id ?? 0);
              this.logger.log(`Successfully pinned message in ${group.name}`);
            } catch (error) {
              this.logger.warn(
                `Failed to pin message in ${group.name}: ${(error as Error).message || 'Unknown error'}`,
              );
              // We don't consider pin failures as a broadcast failure
            }
          }
        } catch (error) {
          this.logger.error(`Error broadcasting to group ${group.name}:`, error);
          failedGroups.push(group.name);
          errorDetails[group.name] = (error as Error).message || 'Unknown error';
        }
      }

      // Determine overall success/failure
      if (failedGroups.length === 0) {
        return {
          success: true,
          message: `Successfully broadcasted to all ${successfulGroups.length} groups.`,
          groupCount: successfulGroups.length,
        };
      } else if (successfulGroups.length > 0) {
        return {
          success: true,
          message: `Broadcast was successful to ${successfulGroups.length} groups but failed for ${failedGroups.length} groups.`,
          groupCount: successfulGroups.length,
          failedGroups,
          errorDetails,
        };
      } else {
        let errorMessage = 'Broadcast failed for all target groups.';

        // Add detailed error information
        if (Object.keys(errorDetails).length > 0) {
          errorMessage += '\n\nError details:';
          Object.entries(errorDetails).forEach(([group, error]) => {
            errorMessage += `\n- ${group}: ${error}`;
          });
        }

        return {
          success: false,
          message: errorMessage,
          groupCount: 0,
          failedGroups,
          errorDetails,
        };
      }
    } catch (error: unknown) {
      this.logger.error('Broadcast error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `An error occurred during broadcast: ${errorMessage}`,
        groupCount: 0,
      };
    }
  }
}
