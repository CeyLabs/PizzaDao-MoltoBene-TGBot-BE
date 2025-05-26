import { ICity } from '../city/city.interface';

/**
 * @fileoverview Type definitions for the broadcast module
 * @module broadcast.type
 */

/**
 * Interface representing a user's access level and associated data
 * @interface IUserAccess
 * @description Defines the structure of user access data, including role
 * and associated city, region, or country information
 */
export interface IUserAccess {
  /** User's role in the system */
  role: string;
  /** Optional array of cities the user has access to */
  city_data?: { city_name: string }[];
  /** Optional name of the region the user has access to */
  region_name?: string;
  /** Optional name of the country the user has access to */
  country_name?: string;
}

/**
 * Interface representing admin access data
 * @interface IAdminAccessResult
 * @description Defines the structure of admin access data, including
 * detailed information about cities, regions, and countries
 */
export interface IAdminAccessResult {
  /** Admin role identifier */
  role: 'admin';
  /** Array of cities with detailed information */
  city_data: {
    city_id: string;
    city_name: string;
    group_id: string | null;
    telegram_link: string | null;
  }[];
  /** Array of regions with detailed information */
  region_data: {
    region_id: string;
    region_name: string;
    country_id: string;
    country_name: string;
    city_id: string;
    city_name: string;
    group_id: string | null;
    telegram_link: string | null;
  }[];
  /** Array of countries with detailed information */
  country_data: {
    country_id: string;
    country_name: string;
    city_data: {
      city_id: string;
      city_name: string;
      group_id: string | null;
      telegram_link: string | null;
    }[];
  }[];
}

/**
 * Interface representing user access information
 * @interface IUserAccessInfo
 * @description Defines the structure of user access information,
 * including access data, role, and user ID
 */
export interface IUserAccessInfo {
  /** User's access data */
  userAccess: IUserAccess[] | IAdminAccessResult | null;
  /** User's role */
  role: string;
  /** User's Telegram ID */
  userId: number | undefined;
}

/**
 * Interface representing a post message
 * @interface IPostMessage
 * @description Defines the structure of a message to be broadcast,
 * including text, media, and URL buttons
 */
export interface IPostMessage {
  /** Message text content */
  text: string | null;
  /** Whether the message should be pinned */
  isPinned: boolean;
  /** Array of URL buttons to be attached to the message */
  urlButtons: { text: string; url: string }[];
  /** URL of the media to be attached */
  mediaUrl: string | null;
  /** Type of media to be attached */
  mediaType?: 'photo' | 'video' | 'document' | 'animation';
  /** ID of the message in Telegram */
  messageId?: number;
}

interface ISelectedCity extends ICity {
  country_name: string;
}

/**
 * Interface representing a broadcast session
 * @interface IBroadcastSession
 * @description Defines the structure of a broadcast session,
 * including current step, selected action, and message data
 */
export interface IBroadcastSession {
  /** Current step in the broadcast process */
  step: 'awaiting_message' | 'creating_post' | 'idle';
  /** Currently selected action */
  selectedAction?: string;
  /** Array of messages in the broadcast */
  messages: IPostMessage[];
  /** Current action being performed */
  currentAction?: 'attach_media' | 'add_url_buttons';
  /** Index of the current message being edited */
  currentMessageIndex?: number;
  selectedCity?: ISelectedCity[];
}
