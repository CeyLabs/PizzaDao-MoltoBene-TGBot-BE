import { Injectable, Logger } from '@nestjs/common';
import { TelegramGroup } from './interfaces/telegram-group.interface';
import { BroadcastMessage } from './interfaces/broadcast-message.interface';
import { dummyGroups, dummyCityData, dummyAdmins } from './data/dummy-data';
import { BroadcastResult } from './interfaces/broadcast-result.interface';
import { config } from '../config/config';

@Injectable()
export class BroadcastFlowService {
  private readonly logger = new Logger(BroadcastFlowService.name);
  private groups: TelegramGroup[] = dummyGroups;
  private cityData = dummyCityData;
  private admins = dummyAdmins;

  constructor() {
    this.logger.log(
      `Broadcasting service initialized in ${config.environment} mode`,
    );
    if (config.isDev) {
      this.logger.log(
        'Development mode: All users will have admin permissions',
      );
    }
  }

  getGroups(): TelegramGroup[] {
    return this.groups;
  }

  getGroupsByCity(city: string): TelegramGroup[] {
    return this.groups.filter((group) => group.city === city);
  }

  getAllCities(): string[] {
    return [...new Set(this.groups.map((group) => group.city))];
  }

  async isSuperAdmin(userId: number): Promise<boolean> {
    this.logger.debug(`Checking super admin status for user: ${userId}`);

    // In development mode, treat all users as super admins
    if (config.isDev) {
      this.logger.debug('Development mode: Auto-granting super admin rights');
      return true;
    }

    // Check if user matches any admin records
    const adminRecord = this.admins.find(
      (admin) => admin.userId === userId || admin.userId === 0,
    );
    const isSuperAdmin =
      adminRecord?.role === 'super-admin' || adminRecord?.userId === 0;

    this.logger.debug(`User ${userId} super admin status: ${isSuperAdmin}`);
    return isSuperAdmin;
  }

  async isAdminForCity(userId: number, city: string): Promise<boolean> {
    this.logger.debug(
      `Checking admin rights for user: ${userId}, city: ${city}`,
    );

    // In development mode, treat all users as having permission
    if (config.isDev) {
      this.logger.debug('Development mode: Auto-granting city admin rights');
      return true;
    }

    // Check if user matches any admin records
    const adminRecord = this.admins.find(
      (admin) => admin.userId === userId || admin.userId === 0,
    );
    if (!adminRecord) {
      this.logger.debug(`User ${userId} has no admin record`);
      return false;
    }

    // Super admins have access to all cities
    if (adminRecord.role === 'super-admin' || adminRecord.userId === 0) {
      this.logger.debug(
        `User ${userId} is super admin with access to all cities`,
      );
      return true;
    }

    // Regular admins only have access to their assigned cities
    const hasAccess = adminRecord.cities.includes(city);
    this.logger.debug(`User ${userId} has access to ${city}: ${hasAccess}`);
    return hasAccess;
  }

  async broadcastMessage(
    message: BroadcastMessage,
    ctx: any,
  ): Promise<BroadcastResult> {
    let targetGroups: TelegramGroup[] = [];
    const userId = ctx.from?.id;

    this.logger.log(`Broadcasting message by user ID: ${userId}`);

    try {
      // Determine target groups based on scope and permissions
      if (message.scope === 'all') {
        // Check if user is super admin
        const isSuperAdmin = await this.isSuperAdmin(userId);
        this.logger.log(`User ${userId} is super admin: ${isSuperAdmin}`);

        if (!isSuperAdmin) {
          return {
            success: false,
            message: "You don't have permission to broadcast to all groups.",
            groupCount: 0,
          };
        }
        targetGroups = this.groups;
      } else if (message.scope === 'city' && message.city) {
        // Check if user has admin rights for this city
        const hasPermission = await this.isAdminForCity(userId, message.city);
        this.logger.log(
          `User ${userId} has permission for city ${message.city}: ${hasPermission}`,
        );

        if (!hasPermission) {
          return {
            success: false,
            message: `You don't have permission to broadcast to ${message.city}.`,
            groupCount: 0,
          };
        }
        targetGroups = this.getGroupsByCity(message.city);
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

      for (const group of targetGroups) {
        try {
          this.logger.log(
            `Broadcasting to group: ${group.name} (${group.chatId})`,
          );

          // Prepare message options
          const messageOptions: any = {
            parse_mode: 'Markdown',
          };

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
            this.logger.log(`Sending image message to ${group.name}`);

            try {
              sentMessage = await ctx.telegram.sendPhoto(
                group.chatId,
                message.image,
                {
                  caption: messageText,
                  ...messageOptions,
                },
              );
              successfulGroups.push(group.name);
              this.logger.log(
                `Successfully sent image message to ${group.name}`,
              );
            } catch (error) {
              this.logger.error(
                `Error sending photo to ${group.name}: ${error.message}`,
              );
              failedGroups.push(group.name);
              errorDetails[group.name] = error.message;
              continue;
            }
          } else {
            this.logger.log(`Sending text message to ${group.name}`);

            try {
              sentMessage = await ctx.telegram.sendMessage(
                group.chatId,
                messageText,
                messageOptions,
              );
              successfulGroups.push(group.name);
              this.logger.log(
                `Successfully sent text message to ${group.name}`,
              );
            } catch (error) {
              this.logger.error(
                `Error sending message to ${group.name}: ${error.message}`,
              );
              failedGroups.push(group.name);
              errorDetails[group.name] = error.message;
              continue;
            }
          }

          // Pin message if requested
          if (message.pin && sentMessage) {
            this.logger.log(`Pinning message in ${group.name}`);

            try {
              await ctx.telegram.pinChatMessage(
                group.chatId,
                sentMessage.message_id,
              );
              this.logger.log(`Successfully pinned message in ${group.name}`);
            } catch (error) {
              this.logger.warn(
                `Failed to pin message in ${group.name}: ${error.message}`,
              );
              // We don't consider pin failures as a broadcast failure
            }
          }
        } catch (error) {
          this.logger.error(
            `Error broadcasting to group ${group.name}:`,
            error,
          );
          failedGroups.push(group.name);
          errorDetails[group.name] = error.message || 'Unknown error';
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
    } catch (error) {
      this.logger.error('Broadcast error:', error);
      return {
        success: false,
        message: `An error occurred during broadcast: ${error.message || 'Unknown error'}`,
        groupCount: 0,
      };
    }
  }
}
