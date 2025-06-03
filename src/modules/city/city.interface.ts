/**
 * @fileoverview Interfaces for the city module
 * @module city.interface
 */

/**
 * Interface representing a city in the system
 * @interface ICity
 * @description Defines the structure of city data, including its ID,
 * name, associated country, and Telegram group information
 */
export interface ICity {
  /**
   * Unique identifier for the city
   * @type {string}
   */
  id: string;

  /**
   * Name of the city
   * @type {string}
   */
  name: string;

  /**
   * ID of the country the city belongs to
   * @type {string}
   */
  country_id: string;

  /**
   * Optional ID of the Telegram group associated with the city
   * @type {string}
   * @optional
   */
  group_id?: string;

  /**
   * Optional Telegram group link for the city
   * @type {string}
   * @optional
   */
  telegram_link?: string;
}

/**
 * Interface for city data used in variable substitution
 * @interface ICityForVars
 * @description Defines the structure of city data used for variable
 * substitution in messages and templates, containing only the essential
 * information needed for display and linking
 */
export interface ICityForVars {
  /**
   * Name of the city
   * @type {string}
   */
  city_name: string;

  /**
   * Optional Telegram group ID
   * @type {string | null}
   * @optional
   */
  group_id?: string | null;

  /**
   * Optional Telegram group link
   * @type {string | null}
   * @optional
   */
  telegram_link?: string | null;
}
