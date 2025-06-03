/**
 * @fileoverview Interfaces for the city module
 * @module city.interface
 */

/**
 * Interface representing a city in the system
 * @interface ICity
 * @description Defines the structure of city data, including its ID,
 * name, associated country, and Telegram group link
 */
export interface ICity {
  /** Unique identifier for the city */
  id: string;
  /** Name of the city */
  name: string;
  /** ID of the country the city belongs to */
  country_id: string;
  /** Optional ID of the Telegram group associated with the city */
  group_id?: string;
  /** Optional Telegram group link for the city */
  telegram_link?: string;
}

/**
 * Interface for city data used in variable substitution
 * @interface ICityForVars
 * @description Defines the structure of city data used for variable
 * substitution in messages and templates
 */
export interface ICityForVars {
  /** Name of the city */
  city_name: string;
  /** Optional Telegram group ID */
  group_id?: string | null;
  /** Optional Telegram group link */
  telegram_link?: string | null;
}
