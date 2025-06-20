/**
 * @fileoverview Service for managing country-related operations
 * @module country.service
 */

import RunCache from 'run-cache';
import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { ICountry } from './country.interface';
import { ICity } from '../city/city.interface';

/**
 * Service for managing country data and operations
 * @class CountryService
 * @description Handles country-related operations, including retrieving
 * countries by region, finding countries by ID or group ID, and managing
 * country data
 */
@Injectable()
export class CountryService {
  constructor(private readonly knexService: KnexService) {}

  /**
   * Retrieves all countries in a specific region
   * @param {string} regionId - The ID of the region
   * @returns {Promise<ICountry[]>} Array of countries in the region
   */
  async getCountriesByRegion(regionId: string): Promise<ICountry[]> {
    return this.knexService.knex('country').where({ region_id: regionId }).select('id', 'name');
  }

  /**
   * Finds a country by its ID
   * @param {string} countryId - The ID of the country to find
   * @returns {Promise<ICountry | null>} The found country or null if not found
   */
  async getCountryById(countryId: string): Promise<ICountry | null> {
    const country = await this.knexService
      .knex<ICountry>('country')
      .where('id', countryId)
      .select('id', 'name', 'region_id', 'created_at', 'updated_at')
      .first();
    return country ?? null;
  }

  /**
   * Retrieves countries by multiple region IDs
   * @param {string[]} region_ids - Array of region IDs to filter countries by
   * @returns {Promise<ICountry[]>} Array of countries matching the region IDs
   */
  async getCountriesByRegionIds(region_ids: string[]): Promise<ICountry[]> {
    const cacheKey = `countries:region_ids:${region_ids.join(',')}`;
    const cachedCountries = await RunCache.get(cacheKey);

    if (cachedCountries) {
      return JSON.parse(cachedCountries as string) as ICountry[];
    }

    const countries = await this.knexService
      .knex<ICountry>('country')
      .whereIn('region_id', region_ids)
      .select('id', 'name', 'region_id');

    await RunCache.set({ key: cacheKey, value: JSON.stringify(countries) });

    return countries;
  }

  /**
   * Retrieves countries by multiple country IDs
   * @param {string[]} country_ids - Array of country IDs to retrieve
   * @returns {Promise<ICountry[]>} Array of countries matching the provided IDs
   */
  async getCountriesByCountryIds(country_ids: string[]): Promise<ICountry[]> {
    const cacheKey = `countries:ids:${country_ids.join(',')}`;
    const cachedCountries = await RunCache.get(cacheKey);

    if (cachedCountries) {
      return JSON.parse(cachedCountries as string) as ICountry[];
    }

    const countries = await this.knexService
      .knex<ICountry>('country')
      .whereIn('id', country_ids)
      .select('id', 'name', 'region_id');

    await RunCache.set({ key: cacheKey, value: JSON.stringify(countries) });

    return countries;
  }

  /**
   * Finds a country by a Telegram group ID
   * @param {string} groupId - The Telegram group ID
   * @returns {Promise<string | null>} The name of the country or null if not found
   */
  async getCountryByGroupId(groupId: string): Promise<string | null> {
    const city = await this.knexService.knex<ICity>('city').where('group_id', groupId).first();
    if (!city) return null;
    const country = await this.knexService
      .knex<ICountry>('country')
      .where('id', city.country_id)
      .first();
    return country ? country.name : null;
  }

  /**
   * Retrieves all countries from the database
   * @returns {Promise<ICountry[]>} Array of all countries with their basic information
   */
  async getAllCountries(): Promise<ICountry[]> {
    const cacheKey = 'countries:all';

    const cachedCountries = await RunCache.get(cacheKey);

    if (cachedCountries) {
      return JSON.parse(cachedCountries as string) as ICountry[];
    }

    const countries = await this.knexService
      .knex<ICountry>('country')
      .select('id', 'name', 'region_id');

    await RunCache.set({ key: cacheKey, value: JSON.stringify(countries) });

    return countries;
  }
}
