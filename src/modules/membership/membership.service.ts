/**
 * @fileoverview Service for managing user memberships in cities
 * @module membership.service
 */

import { Injectable } from '@nestjs/common';
import { IMembership } from './membership.interface';
import { KnexService } from '../knex/knex.service';

/**
 * Service for managing user memberships in cities
 * @class MembershipService
 * @description Handles operations related to user memberships in cities,
 * including checking memberships, adding users to cities, and retrieving
 * city participation data
 */
@Injectable()
export class MembershipService {
  constructor(private readonly knexService: KnexService) {}

  /**
   * Retrieves all cities a user is a member of
   * @param {string} userId - The user's Telegram ID
   * @returns {Promise<{ city_id: number; city_name: string }[]>} Array of cities the user is a member of
   */
  async getCitiesByUser(userId: string): Promise<{ city_id: number; city_name: string }[]> {
    return this.knexService
      .knex('membership')
      .join('city', 'membership.city_id', 'city.id')
      .select('city.id as city_id', 'city.name as city_name')
      .where('membership.user_telegram_id', userId);
  }

  /**
   * Checks if a user is a member of a specific city
   * @param {string} userId - The user's Telegram ID
   * @param {string} cityId - The city ID to check
   * @returns {Promise<boolean>} True if the user is a member of the city
   */
  async checkUserCityMembership(userId: string, cityId: string): Promise<boolean> {
    const participation = await this.knexService
      .knex<IMembership>('membership')
      .where('user_telegram_id', userId)
      .andWhere('city_id', cityId)
      .first();

    return !!participation;
  }

  /**
   * Adds a user to a city's membership
   * @param {string | null} userId - The user's Telegram ID
   * @param {string} cityId - The city ID to add the user to
   * @returns {Promise<IMembership | undefined>} The created or existing membership record
   */
  async addUserToCityMembership(
    userId: string | null,
    cityId: string,
  ): Promise<IMembership | undefined> {
    // Check if the user has already joined this city
    const existingParticipation = await this.knexService
      .knex<IMembership>('membership')
      .where('user_telegram_id', userId)
      .andWhere('city_id', cityId)
      .first();

    if (!existingParticipation) {
      // Insert a new record if the user hasn't joined this city before
      await this.knexService.knex('membership').insert({
        user_telegram_id: userId,
        city_id: cityId,
      });

      // Fetch and return the newly inserted record
      return this.knexService
        .knex<IMembership>('membership')
        .where('user_telegram_id', userId)
        .andWhere('city_id', cityId)
        .first();
    }

    return existingParticipation;
  }
}
