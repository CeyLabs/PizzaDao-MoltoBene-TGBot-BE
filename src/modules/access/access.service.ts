/**
 * @fileoverview Service for managing access control
 * @module access.service
 */

import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { ICityAccess, ICountryAccess, IRegionAccess } from './access.interface';
import { IRegion } from '../region/city.interface';
import { ICountry } from '../country/country.interface';
import { ICity } from '../city/city.interface';

type Role = 'admin' | 'underboss' | 'caporegime' | 'host';

type RegionData = {
  region_id: string;
  region_name: string;
};

type CountryData = {
  region_id: string;
  country_id: string;
  country_name: string;
};

/**
 * Type definition for region data
 * @typedef {Object} CityData
 * @property {string} region_id - Unique identifier for the region
 * @property {string} country_id - ID of the country the region belongs to
 * @property {string} city_id - ID of the city in the region
 * @property {string} city_name - Name of the city
 * @property {string | null} group_id - Telegram group ID for the city
 * @property {string | null} telegram_link - Telegram link for the city's group
 */
type CityData = {
  region_id: string;
  country_id: string;
  city_id: string;
  city_name: string;
  group_id: string | null;
  telegram_link: string | null;
};

type AccessResult = {
  role: Role | null,
  country_data: CountryData[],
  region_data: RegionData[],
  city_data: CityData[],
};

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
  async getAccessRole(telegram_id: string): Promise<Role | null> {
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

  async getRegionAccess(telegram_id: string): Promise<IRegionAccess[]> {
    return this.knexService.knex('region_access').where('user_telegram_id', telegram_id);
  }

  async getCountryAccess(telegram_id: string): Promise<ICountryAccess[]> {
    return this.knexService.knex('country_access').where('user_telegram_id', telegram_id);
  }

  async getCityAccess(telegram_id: string): Promise<ICityAccess[]> {
    return this.knexService.knex('city_access').where('user_telegram_id', telegram_id);
  }

  async getRegionsByIds(region_ids: string[]): Promise<IRegion[]> {
    return this.knexService.knex('region').whereIn('id', region_ids);
  }

  async getCountriesByRegionIds(region_ids: string[]): Promise<ICountry[]> {
    return this.knexService.knex('country').whereIn('region_id', region_ids);
  }

  async getCountriesByCountryIds(country_ids: string[]): Promise<ICountry[]> {
    return this.knexService.knex('country').whereIn('id', country_ids);
  }

  async getCitiesByCountryIds(country_ids: string[]): Promise<ICity[]> {
    return this.knexService.knex('city').whereIn('country_id', country_ids);
  }

  async getCitiesByCityIds(city_ids: string[]): Promise<ICity[]> {
    return this.knexService.knex('city').whereIn('id', city_ids);
  }

  /**
   * Gets detailed access information for a user
   * @param {string} telegram_id - The Telegram ID of the user
   * @returns {Promise<AccessResult>} Detailed access information including cities, regions, and countries
   */
  async getUserAccess(telegram_id: string): Promise<AccessResult | null> {
    const adminIds: string[] = process.env.ADMIN_IDS
      ? process.env.ADMIN_IDS.split(',').map((id) => id.trim())
      : [];

    if (adminIds.includes(telegram_id)) {
        const allRegions: RegionData[] = await this.knexService
        .knex('region')
        .select('region.id as region_id', 'region.name as region_name');

      const allCountries: CountryData[] = await this.knexService
        .knex('country')
        .select('country.id as country_id', 'country.name as country_name', 'country.region_id as region_id');

      const allCities: CityData[] = await this.knexService
        .knex('city')
        .join('country', 'country.id', 'city.country_id')
        .select('city.id as city_id', 'city.name as city_name', 'city.group_id as group_id', 'city.telegram_link as telegram_link', 'city.country_id as country_id', 'country.region_id as region_id');

        console.log(allRegions[0], allCountries[0], allCities[0])

      return {
        role: 'admin',
        city_data: allCities,
        region_data: allRegions,
        country_data: allCountries,
      };
    }

    const accessResult: AccessResult = {
      role: null,
      city_data: [],
      region_data: [],
      country_data: [],
    };

    const regionAccess = await this.getRegionAccess(telegram_id);

    if (regionAccess.length) {
      const regions = await this.getRegionsByIds(regionAccess.map((access) => access.region_id))

      accessResult.region_data = regions.map((region) => ({
        region_id: region.id,
        region_name: region.name,
      }));

      const countries = await this.getCountriesByRegionIds(regions.map((region) => region.id))

      accessResult.country_data = countries.map((country) => ({
        country_id: country.id,
        country_name: country.name,
        region_id: country.region_id,
      }));

      const cities = await this.getCitiesByCountryIds(countries.map((country) => country.id));

      accessResult.city_data = cities.map((city) => ({
        city_id: city.id,
        city_name: city.name,
        country_id: city.country_id,
        region_id: accessResult.country_data.find((country) => country.country_id === city.country_id)!.region_id,
        group_id: city.group_id!,
        telegram_link: city.telegram_link!,
      }));

      accessResult.role = 'underboss';

      return accessResult;
    }

    const countryAccess = await this.getCountryAccess(telegram_id);

    if (countryAccess.length) {
      const countries = await this.getCountriesByCountryIds(countryAccess.map((access) => access.id))

      accessResult.country_data = countries.map((country) => ({
        country_id: country.id,
        country_name: country.name,
        region_id: country.region_id,
      }));

      const cities = await this.getCitiesByCountryIds(countries.map((country) => country.id))

      accessResult.city_data = cities.map((city) => ({
        city_id: city.id,
        city_name: city.name,
        country_id: city.country_id,
        region_id: accessResult.country_data.find((country) => country.country_id === city.country_id)!.region_id,
        group_id: city.group_id!, // TODO: ! needs to be removed
        telegram_link: city.telegram_link!,
      }));

      accessResult.role = 'caporegime';

      return accessResult;
    }

    const cityAccess = await this.getCityAccess(telegram_id)

    if (cityAccess.length) {
      const cities = await this.getCitiesByCityIds(cityAccess.map((access) => access.id))

      accessResult.city_data = cities.map((city) => ({
        city_id: city.id,
        city_name: city.name,
        country_id: city.country_id,
        region_id: accessResult.country_data.find((country) => country.country_id === city.country_id)!.region_id,
        group_id: city.group_id!,
        telegram_link: city.telegram_link!,
      }));

      accessResult.role = 'host';

      return accessResult;
    }

    return null;
  }
}
