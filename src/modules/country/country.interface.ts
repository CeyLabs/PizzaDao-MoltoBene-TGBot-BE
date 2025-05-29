/**
 * @fileoverview Interfaces for the country module
 * @module country.interface
 */

/**
 * Interface representing a country in the system
 * @interface ICountry
 * @description Defines the structure of country data, including its ID,
 * name, associated region, and timestamps
 */
export interface ICountry {
  /** Unique identifier for the country */
  id: string;
  /** Name of the country */
  name: string;
  /** ID of the region the country belongs to */
  region_id: string;
  /** Timestamp when the country record was created */
  created_at: Date;
  /** Timestamp when the country record was last updated */
  updated_at: Date;
}
