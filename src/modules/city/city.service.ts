/**
 * @fileoverview Service for managing city-related operations
 * @module city.service
 */

import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { ICity } from './city.interface';

/**
 * Service for managing city data and operations
 * @class CityService
 * @description Handles city-related operations, including retrieving
 * cities by country, finding cities by ID or group ID, and managing
 * city data
 */
@Injectable()
export class CityService {
  constructor(private readonly knexService: KnexService) {}

  /**
   * Retrieves all cities from the database
   * @returns {Promise<ICity[]>} Array of all cities
   */
  async getAllCities(): Promise<ICity[]> {
    return this.knexService.knex('city').select('id', 'name', 'group_id', 'country_id');
  }

  /**
   * Retrieves all cities in a specific country
   * @param {string} countryId - The ID of the country
   * @returns {Promise<ICity[]>} Array of cities in the country
   */
  async getCitiesByCountry(countryId: string): Promise<ICity[]> {
    return this.knexService
      .knex('city')
      .where({ country_id: countryId })
      .select('id', 'name', 'group_id', 'telegram_link', 'country_id');
  }

  /**
   * Finds a city by its ID
   * @param {string} cityId - The ID of the city to find
   * @returns {Promise<ICity | null>} The found city or null if not found
   */
  async getCityById(cityId: string): Promise<ICity | null> {
    const city = await this.knexService
      .knex<ICity>('city')
      .where('id', cityId)
      .select('id', 'name', 'country_id')
      .first();
    return city || null;
  }

  // async updateCityAdmins(cityId: string, adminIds: string[]): Promise<void> {
  //   // Validate that all adminIds belong to users with the role 'admin'
  //   const validAdminIds = await this.knexService
  //     .knex('user')
  //     .whereIn('id', adminIds)
  //     .andWhere({ role: 'admin' })
  //     .pluck('id');

  //   // Update the city with the validated admin IDs
  //   await this.knexService.knex('city').where({ id: cityId }).update({ admin_ids: validAdminIds });
  // }

  /**
   * Finds a city by a Telegram group ID
   * @param {string | number} groupId - The Telegram group ID
   * @returns {Promise<ICity | null>} The found city or null if not found
   */
  async getCityByGroupId(groupId: string | number): Promise<ICity | null> {
    const city = (await this.knexService
      .knex('city')
      .where('group_id', groupId)
      .select('id', 'name', 'country_id')
      .first()) as ICity | undefined;
    return city || null;
  }
}
