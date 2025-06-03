/**
 * @fileoverview Service for managing country-related operations
 * @module country.service
 */

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

  async getAllCountries(): Promise<ICountry[]> {
    return this.knexService.knex('country').select('id', 'name', 'region_id');
  }
}
