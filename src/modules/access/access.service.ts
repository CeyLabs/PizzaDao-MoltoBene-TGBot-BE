/**
 * @fileoverview Service for managing access control
 * @module access.service
 */

import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { ICityAccess, ICountryAccess, IRegionAccess } from './access.interface';
import { RegionService } from '../region/region.service';
import { CountryService } from '../country/country.service';
import { CityService } from '../city/city.service';
import { IBroadcastMessageDetail } from '../broadcast/broadcast.type';

/**
 * Type representing user roles in the system
 * @typedef {('admin' | 'underboss' | 'caporegime' | 'host')} TRole
 * @description Defines the possible roles a user can have in the system:
 * - admin: Full system access
 * - underboss: Region-level access
 * - caporegime: Country-level access
 * - host: City-level access
 */
type TRole = 'admin' | 'underboss' | 'caporegime' | 'host';

/**
 * Type representing region data structure
 * @typedef {Object} TRegionData
 * @property {string} region_id - Unique identifier for the region
 * @property {string} region_name - Name of the region
 */
type TRegionData = {
  region_id: string;
  region_name: string;
};

/**
 * Type representing country data structure
 * @typedef {Object} TCountryData
 * @property {string} region_id - ID of the region the country belongs to
 * @property {string} country_id - Unique identifier for the country
 * @property {string} country_name - Name of the country
 */
type TCountryData = {
  region_id: string;
  country_id: string;
  country_name: string;
};

/**
 * Type representing city data structure
 * @typedef {Object} TCityData
 * @property {string} region_id - ID of the region the city belongs to
 * @property {string} country_id - ID of the country the city belongs to
 * @property {string} city_id - Unique identifier for the city
 * @property {string} city_name - Name of the city
 * @property {string | null} group_id - Telegram group ID for the city
 * @property {string | null} telegram_link - Telegram link for the city's group
 */
type TCityData = {
  region_id: string;
  country_id: string;
  city_id: string;
  city_name: string;
  group_id: string | null;
  telegram_link: string | null;
};

/**
 * Type representing the complete access result for a user
 * @typedef {Object} TAccessResult
 * @property {TRole | null} role - The user's role in the system
 * @property {TCountryData[]} country_data - Array of countries the user has access to
 * @property {TRegionData[]} region_data - Array of regions the user has access to
 * @property {TCityData[]} city_data - Array of cities the user has access to
 */
type TAccessResult = {
  role: TRole | null;
  country_data: TCountryData[];
  region_data: TRegionData[];
  city_data: TCityData[];
};

/**
 * Service for managing access control
 * @class AccessService
 * @description Handles user access control at different levels (city, country, region)
 * and provides methods to check and retrieve user roles and access permissions
 */
@Injectable()
export class AccessService {
  constructor(
    private readonly knexService: KnexService,
    private readonly regionService: RegionService,
    private readonly countryService: CountryService,
    private readonly cityService: CityService,
  ) {}

  async getRegionAccess(telegram_id: string): Promise<IRegionAccess[]> {
    return this.knexService.knex('region_access').where('user_telegram_id', telegram_id);
  }

  async getCountryAccess(telegram_id: string): Promise<ICountryAccess[]> {
    return this.knexService.knex('country_access').where('user_telegram_id', telegram_id);
  }

  async getCityAccess(telegram_id: string): Promise<ICityAccess[]> {
    return this.knexService.knex('city_access').where('user_telegram_id', telegram_id);
  }

  /**
   * Gets detailed access information for a user
   * @param {string} telegram_id - The Telegram ID of the user
   * @returns {Promise<AccessResult>} Detailed access information including cities, regions, and countries
   */
  async getUserAccess(telegram_id: string): Promise<TAccessResult | null> {
    const adminIds: string[] = process.env.ADMIN_IDS
      ? process.env.ADMIN_IDS.split(',').map((id) => id.trim())
      : [];

    if (adminIds.includes(telegram_id)) {
      const allRegions: TRegionData[] = await this.knexService
        .knex('region')
        .select('region.id as region_id', 'region.name as region_name');

      const allCountries: TCountryData[] = await this.knexService
        .knex('country')
        .select(
          'country.id as country_id',
          'country.name as country_name',
          'country.region_id as region_id',
        );

      const allCities: TCityData[] = await this.knexService
        .knex('city')
        .join('country', 'country.id', 'city.country_id')
        .select(
          'city.id as city_id',
          'city.name as city_name',
          'city.group_id as group_id',
          'city.telegram_link as telegram_link',
          'city.country_id as country_id',
          'country.region_id as region_id',
        );

      return {
        role: 'admin',
        city_data: allCities,
        region_data: allRegions,
        country_data: allCountries,
      };
    }

    const accessResult: TAccessResult = {
      role: null,
      city_data: [],
      region_data: [],
      country_data: [],
    };

    const regionAccess = await this.getRegionAccess(telegram_id);

    if (regionAccess.length) {
      const regions = await this.regionService.getRegionsByIds(
        regionAccess.map((access) => access.region_id),
      );

      accessResult.region_data = regions.map((region) => ({
        region_id: region.id,
        region_name: region.name,
      }));

      const countries = await this.countryService.getCountriesByRegionIds(
        regions.map((region) => region.id),
      );

      accessResult.country_data = countries.map((country) => ({
        country_id: country.id,
        country_name: country.name,
        region_id: country.region_id,
      }));

      const cities = await this.cityService.getCitiesByCountryIds(
        countries.map((country) => country.id),
      );

      accessResult.city_data = cities.map((city) => ({
        city_id: city.id,
        city_name: city.name,
        country_id: city.country_id,
        region_id: accessResult.country_data.find(
          (country) => country.country_id === city.country_id,
        )!.region_id,
        group_id: city.group_id!,
        telegram_link: city.telegram_link!,
      }));

      accessResult.role = 'underboss';

      return accessResult;
    }

    const countryAccess = await this.getCountryAccess(telegram_id);

    if (countryAccess.length) {
      const countries = await this.countryService.getCountriesByCountryIds(
        countryAccess.map((access) => access.id),
      );

      accessResult.country_data = countries.map((country) => ({
        country_id: country.id,
        country_name: country.name,
        region_id: country.region_id,
      }));

      const cities = await this.cityService.getCitiesByCountryIds(
        countries.map((country) => country.id),
      );

      accessResult.city_data = cities.map((city) => ({
        city_id: city.id,
        city_name: city.name,
        country_id: city.country_id,
        region_id: accessResult.country_data.find(
          (country) => country.country_id === city.country_id,
        )!.region_id,
        group_id: city.group_id!, // TODO: ! needs to be removed
        telegram_link: city.telegram_link!,
      }));

      accessResult.role = 'caporegime';

      return accessResult;
    }

    const cityAccess = await this.getCityAccess(telegram_id);

    if (cityAccess.length) {
      const cities = await this.cityService.getCitiesByCityIds(
        cityAccess.map((access) => access.id),
      );

      accessResult.city_data = cities.map((city) => ({
        city_id: city.id,
        city_name: city.name,
        country_id: city.country_id,
        region_id: accessResult.country_data.find(
          (country) => country.country_id === city.country_id,
        )!.region_id,
        group_id: city.group_id!,
        telegram_link: city.telegram_link!,
      }));

      accessResult.role = 'host';

      return accessResult;
    }

    return null;
  }


  /**
   * Save broadcast message detail to the database
   * @param {string} broadcastId - The ID of the existing broadcast record
   * @param {Message} sentMessage - The sent Telegram message
   * @param {Object} city - The city the message was sent to
   * @param {boolean} isSent - Whether the message was successfully sent
   * @private
   */
  private async saveMessageDetail(
    broadcastId: string,
    messageId: string | undefined,
    city: { city_name: string; group_id?: string | null },
    isSent: boolean,
  ): Promise<void> {
    try {
      // Insert only the broadcast message detail
      await this.knexService.knex<IBroadcastMessageDetail>('broadcast_message_detail').insert({
        broadcast_id: broadcastId,
        message_id: messageId,
        group_id: city.group_id || '',
        is_sent: isSent,
      });
    } catch (error) {
      console.error(`Error saving broadcast detail: ${error}`);
    }
  }

}
