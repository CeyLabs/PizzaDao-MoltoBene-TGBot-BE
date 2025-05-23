/**
 * @fileoverview Interfaces for the membership module
 * @module membership.interface
 */

/**
 * Interface representing a user's membership in a city
 * @interface IMembership
 * @description Defines the structure of user membership data, including
 * the user's Telegram ID, city ID, and join date
 */
export interface IMembership {
  /** User's Telegram ID */
  user_telegram_id: string | number;
  /** ID of the city the user is a member of */
  city_id: string;
  /** Date when the user joined the city */
  joined_at: Date;
}
