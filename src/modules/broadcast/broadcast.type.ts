import { ICity } from '../city/city.interface';
import { ICountry } from '../country/country.interface';

/**
 * @fileoverview Type definitions for the broadcast module
 * @module broadcast.type
 */

/**
 * Type defining the supported media types for broadcast messages
 * @type TMediaType
 * @description Defines all available media types that can be used in broadcasts
 */
export type TMediaType =
  | 'text'
  | 'photo'
  | 'video'
  | 'audio'
  | 'document'
  | 'animation'
  | 'voice'
  | 'location'
  | 'contact'
  | 'sticker';

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
  /** User's role (admin - everything, underboss - region, caporegime - country, host - city) */
  role: 'admin' | 'underboss' | 'caporegime' | 'host';
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
  mediaType?: TMediaType;
  /** ID of the message in Telegram */
  messageId?: number;
}

/**
 * Represents a selected city with additional information.
 * Extends the `ICity` interface and includes details about the country
 * and a list of related cities.
 *
 * @interface ISelectedCity
 * @extends ICity
 *
 * @property {ICity[]} cities - An array of cities related to the selected city.
 * @property {string} country_name - The name of the country to which the city belongs.
 */
interface ISelectedCity extends ICity {
  cities: ICity[];
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
  targetType?: 'all' | 'region' | 'country' | 'city';
  targetId?: string;
  /** Index of the current message being edited */
  currentMessageIndex?: number;
  selectedCity?: ISelectedCity[];
  selectedCountry?: ISelectedCountry[];
  allCountries?: ICountry[];
  searchType?: 'city' | 'country';
}
/**
 * Represents a selected country with its associated details.
 */
export interface ISelectedCountry {
  /** The unique identifier of the country.*/
  id: string;
  /** The name of the country.*/
  name: string;
  /** An optional list of cities within the country.*/
  cities?: ICity[];
}

/**
 * Interface representing a broadcast entry in the database
 * @interface IBroadcast
 * @description Defines the structure of a broadcast record in the database
 */
export interface IBroadcast {
  /** Unique identifier of the broadcast */
  id?: string;
  /** Type of message being broadcast */
  message_type: TMediaType;
  /** Text content of the message */
  message_text?: string | null;
  /** JSON data for buttons attached to the message */
  button_detail?: string | undefined;
  /** JSON data for any attachments */
  attachment_detail?: Record<string, any>;
  /** ID of the user who sent the broadcast */
  sender_id: number | undefined;
}

/**
 * Interface for broadcast message detail records
 * @interface IBroadcastMessageDetail
 * @description Represents a single broadcast message sent to a specific group
 */
export interface IBroadcastMessageDetail {
  /** Unique identifier for the broadcast message detail */
  id: string;
  /** Reference to the parent broadcast record */
  broadcast_id: string;
  /** Telegram message ID of the sent message */
  message_id?: string;
  /** Reference to the target group's ID */
  group_id: string;
  /** Whether the message has been sent */
  is_sent: boolean;
  /** Timestamp when the message was sent */
  sent_at?: Date;
} 