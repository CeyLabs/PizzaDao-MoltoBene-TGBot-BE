/**
 * @fileoverview Service for managing access control
 * @module access.service
 */

import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { ICityAccess, ICountryAccess, IRegionAccess } from './access.interface';

/**
 * Type definition for city data
 * @typedef {Object} CityData
 * @property {string} city_id - Unique identifier for the city
 * @property {string} city_name - Name of the city
 * @property {string | null} group_id - Telegram group ID for the city
 * @property {string | null} telegram_link - Telegram link for the city's group
 */
type CityData = {
  city_id: string;
  city_name: string;
  group_id: string | null;
  telegram_link: string | null;
};

/**
 * Type definition for region data
 * @typedef {Object} RegionData
 * @property {string} region_id - Unique identifier for the region
 * @property {string} region_name - Name of the region
 * @property {string} country_id - ID of the country the region belongs to
 * @property {string} country_name - Name of the country
 * @property {string} city_id - ID of the city in the region
 * @property {string} city_name - Name of the city
 * @property {string | null} group_id - Telegram group ID for the city
 * @property {string | null} telegram_link - Telegram link for the city's group
 */
type RegionData = {
  region_id: string;
  region_name: string;
  country_id: string;
  country_name: string;
  city_id: string;
  city_name: string;
  group_id: string | null;
  telegram_link: string | null;
};

/**
 * Type definition for admin access result
 * @typedef {Object} AdminAccessResult
 * @property {'admin'} role - Role identifier for admin
 * @property {CityData[]} city_data - Array of city data
 * @property {RegionData[]} region_data - Array of region data
 * @property {Object[]} country_data - Array of country data with associated cities
 */
type AdminAccessResult = {
  role: 'admin';
  city_data: CityData[];
  region_data: RegionData[];
  country_data: {
    country_id: string;
    country_name: string;
    city_data: CityData[];
  }[];
};

/**
 * Type definition for region access result
 * @typedef {Object} RegionAccessResult
 * @property {string} region_id - ID of the region
 * @property {string} region_name - Name of the region
 * @property {'underboss'} role - Role identifier for underboss
 * @property {RegionData[]} region_data - Array of region data
 */
type RegionAccessResult = {
  region_id: string;
  region_name: string;
  role: 'underboss';
  region_data: RegionData[];
};

/**
 * Type definition for country access result
 * @typedef {Object} CountryAccessResult
 * @property {string} country_id - ID of the country
 * @property {string} country_name - Name of the country
 * @property {'caporegime'} role - Role identifier for caporegime
 * @property {CityData[]} city_data - Array of city data
 */
type CountryAccessResult = {
  country_id: string;
  country_name: string;
  role: 'caporegime';
  city_data: CityData[];
};

/**
 * Type definition for city access result
 * @typedef {Object} CityAccessResult
 * @property {'host'} role - Role identifier for host
 * @property {CityData[]} city_data - Array of city data
 */
type CityAccessResult = {
  role: 'host';
  city_data: CityData[];
};

/**
 * Type definition for region access
 * @typedef {Object} regionAccess
 * @property {string} telegram_id - Telegram ID of the user
 * @property {string} region_id - ID of the region
 */
type regionAccess = {
  telegram_id: string;
  region_id: string;
};

type AccessEntry = AdminAccessResult | RegionAccessResult | CountryAccessResult | CityAccessResult;
type AccessResult = AccessEntry[] | null;
type Role = 'admin' | 'underboss' | 'caporegime' | 'host' | null;

/**
 * Service for managing access control
 * @class AccessService
 * @description Handles user access control at different levels (city, country, region)
 * and provides methods to check and retrieve user roles and access permissions
 */
@Injectable()
export class AccessService {
  constructor(private readonly knexService: KnexService) {}

  /**
   * Retrieves all regions from the database
   * @returns {Promise<Array<{id: string, name: string}>>} Array of regions with their IDs and names
   */
  async getAllRegions(): Promise<{ id: string; name: string }[]> {
    return this.knexService.knex('region').select('id', 'name');
  }

  /**
   * Retrieves a specific region by its ID
   * @param {string} regionId - The unique identifier of the region
   * @returns {Promise<{id: string, name: string} | undefined>} Region data or undefined if not found
   */
  async getRegionById(regionId: string): Promise<{ id: string; name: string } | undefined> {
    return this.knexService.knex('region').where('id', regionId).first();
  }

  /**
   * Gets all cities belonging to a specific region
   * @param {string} regionId - The unique identifier of the region
   * @returns {Promise<CityData[]>} Array of cities with their details
   */
  async getCitiesByRegion(regionId: string): Promise<CityData[]> {
    return this.knexService
      .knex('city')
      .join('country', 'city.country_id', 'country.id')
      .where('country.region_id', regionId)
      .select(
        'city.id as city_id',
        'city.name as city_name',
        'city.group_id',
        'city.telegram_link',
      );
  }

  /**
   * Gets the role of a user based on their Telegram ID
   * @param {string} telegram_id - The Telegram ID of the user
   * @returns {Promise<Role>} The user's role or null if no role is assigned
   */
  async getAccessRole(telegram_id: string): Promise<Role> {
    const adminIds: string[] = process.env.ADMIN_IDS
      ? process.env.ADMIN_IDS.split(',').map((id) => id.trim())
      : [];

    if (adminIds.includes(telegram_id)) {
      return 'admin';
    }

    // Check region_access for underboss role
    const regionAccess = await this.knexService
      .knex<IRegionAccess>('region_access')
      .where('user_telegram_id', telegram_id)
      .first();

    if (regionAccess) {
      return 'underboss';
    }

    // Check country_access for caporegime role
    const countryAccess = await this.knexService
      .knex<ICountryAccess>('country_access')
      .where('user_telegram_id', telegram_id)
      .first();

    if (countryAccess) {
      return 'caporegime';
    }

    // Check user table for host role
    const cityAccess = await this.knexService
      .knex<ICityAccess>('city_access')
      .where('user_telegram_id', telegram_id)
      .first();

    if (cityAccess) {
      return 'host';
    }

    return null;
  }

  /**
   * Gets detailed access information for a user
   * @param {string} telegram_id - The Telegram ID of the user
   * @returns {Promise<AccessResult>} Detailed access information including cities, regions, and countries
   */
  async getUserAccess(telegram_id: string): Promise<AccessResult> {
    const adminIds: string[] = process.env.ADMIN_IDS
      ? process.env.ADMIN_IDS.split(',').map((id) => id.trim())
      : [];

    const accessEntries: AccessEntry[] = [];

    if (adminIds.includes(telegram_id)) {
      const cities: CityData[] = await this.knexService
        .knex('city')
        .select('id as city_id', 'name as city_name', 'group_id', 'telegram_link');

      const regions: RegionData[] = await this.knexService
        .knex('region')
        .select('id as region_id', 'name as region_name');

      const country_data: { country_id: string; country_name: string; city_data: CityData[] }[] =
        [];
      for (const region of regions) {
        interface Country {
          country_id: string;
          country_name: string;
        }

        const countries: Country[] = await this.knexService
          .knex<Country>('country')
          .where('region_id', region.region_id)
          .select('id as country_id', 'name as country_name');

        for (const country of countries) {
          const citiesInCountry: CityData[] = await this.knexService
            .knex<CityData>('city')
            .where('country_id', country.country_id)
            .select('id as city_id', 'name as city_name', 'group_id', 'telegram_link');

          country_data.push({
            country_id: country.country_id,
            country_name: country.country_name,
            city_data: citiesInCountry,
          });
        }
      }

      accessEntries.push({
        role: 'admin',
        city_data: cities,
        region_data: regions,
        country_data,
      });

      return accessEntries;
    }

    const regionAccesses = await this.knexService
      .knex<regionAccess>('region_access')
      .where('user_telegram_id', telegram_id);

    for (const regionAccess of regionAccesses) {
      interface Region {
        id: string;
        name: string;
      }

      const region: Region | undefined = await this.knexService
        .knex<Region>('region')
        .where('id', regionAccess.region_id)
        .first();

      if (!region) {
        continue;
      }

      const countries = await this.knexService.knex('country').where('region_id', region.id);

      const region_data: RegionData[] = [];

      for (const country of countries as { id: string; name: string }[]) {
        const cities: CityData[] = await this.knexService
          .knex('city')
          .where('country_id', country.id)
          .select('id as city_id', 'name as city_name', 'group_id', 'telegram_link');

        for (const city of cities) {
          region_data.push({
            region_id: region.id,
            region_name: region.name,
            country_id: country.id,
            country_name: country.name,
            city_id: city.city_id,
            city_name: city.city_name,
            group_id: city.group_id,
            telegram_link: city.telegram_link,
          });
        }
      }

      accessEntries.push({
        region_id: region.id,
        region_name: region.name,
        role: 'underboss',
        region_data,
      });
    }

    // Caporegime (country) access
    const countryAccesses = await this.knexService
      .knex<ICountryAccess>('country_access')
      .where('user_telegram_id', telegram_id);

    for (const countryAccess of countryAccesses) {
      interface ICountry {
        id: string;
        name: string;
      }

      const country = await this.knexService
        .knex<ICountry>('country')
        .where('id', countryAccess.country_id)
        .first();

      if (!country) {
        continue;
      }

      const cities: CityData[] = await this.knexService
        .knex('city')
        .where('country_id', country.id)
        .select('id as city_id', 'name as city_name', 'group_id', 'telegram_link');

      accessEntries.push({
        country_id: country.id,
        country_name: country.name,
        role: 'caporegime',
        city_data: cities,
      });
    }

    // Host (city) access
    const accessibleCityIds = await this.knexService
      .knex('city_access')
      .where('user_telegram_id', telegram_id)
      .pluck('city_id');

    if (accessibleCityIds.length > 0) {
      const cities: CityData[] = await this.knexService
        .knex('city')
        .whereIn('id', accessibleCityIds)
        .select('id as city_id', 'name as city_name', 'group_id', 'telegram_link');

      accessEntries.push({
        role: 'host',
        city_data: cities,
      });
    }

    return accessEntries.length > 0 ? accessEntries : null;
  }
}
