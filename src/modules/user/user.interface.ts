/**
 * @fileoverview Interfaces for the user module
 * @module user.interface
 */

/**
 * Interface representing a user in the system
 * @interface IUser
 * @description Defines the structure of user data including Telegram information,
 * pizza-related preferences, and role information
 */
export interface IUser {
  /** User's Telegram ID */
  telegram_id: string | null;
  /** User's Telegram username */
  username: string | null;
  /** User's Telegram first name */
  tg_first_name: string | null;
  /** User's Telegram last name */
  tg_last_name: string | null;
  /** User's generated pizza name */
  pizza_name: string | null;
  /** User's Discord username */
  discord_name: string | null;
  /** User's favorite mafia movie */
  mafia_movie: string | null;
  /** Array of user's selected ninja turtle characters */
  ninja_turtle_character: string[] | null;
  /** User's favorite pizza topping */
  pizza_topping: string | null;
  /** User's role in the system */
  role?: string | null;
}
