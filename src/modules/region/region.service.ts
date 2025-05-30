/**
 * @fileoverview Service for managing country-related operations
 * @module country.service
 */

import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { IRegion } from './region.interface';

@Injectable()
export class RegionService {
  constructor(private readonly knexService: KnexService) {}

  async getRegionsByIds(region_ids: string[]): Promise<IRegion[]> {
    return this.knexService.knex('region').whereIn('id', region_ids);
  }

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
}
