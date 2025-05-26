/**
 * @fileoverview Interface definitions for access control
 * @module access.interface
 */

/**
 * Interface representing region-level access
 * @interface IRegionAccess
 * @description Defines the structure of user access to a specific region
 */
export interface IRegionAccess {
  /** Unique identifier for the access record */
  id: string;
  /** Telegram ID of the user */
  user_telegram_id: string | number;
  /** ID of the region the user has access to */
  region_id: string;
  /** Timestamp when the access was granted */
  created_at: Date;
}

/**
 * Interface representing country-level access
 * @interface ICountryAccess
 * @description Defines the structure of user access to a specific country
 */
export interface ICountryAccess {
  /** Unique identifier for the access record */
  id: string;
  /** Telegram ID of the user */
  user_telegram_id: string | number;
  /** ID of the country the user has access to */
  country_id: string;
  /** Timestamp when the access was granted */
  created_at: Date;
}

/**
 * Interface representing city-level access
 * @interface ICityAccess
 * @description Defines the structure of user access to a specific city
 */
export interface ICityAccess {
  /** Unique identifier for the access record */
  id: string;
  /** Telegram ID of the user */
  user_telegram_id: string | number;
  /** ID of the city the user has access to */
  city_id: string;
  /** Timestamp when the access was granted */
  created_at: Date;
}
