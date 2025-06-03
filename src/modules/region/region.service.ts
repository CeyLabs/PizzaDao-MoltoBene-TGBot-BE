/**
 * @fileoverview Service for managing region-related operations
 * @module region.service
 */

import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { IRegion } from './region.interface';

@Injectable()
export class RegionService {
  constructor(private readonly knexService: KnexService) {}

  /**
   * Retrieves regions by multiple region IDs
   * @param {string[]} region_ids - Array of region IDs to retrieve
   * @returns {Promise<IRegion[]>} Array of regions matching the provided IDs
   */
  async getRegionsByIds(region_ids: string[]): Promise<IRegion[]> {
    return this.knexService.knex('region').whereIn('id', region_ids);
  }

  /**
   * Retrieves all regions from the database
   * @returns {Promise<IRegion[]>} Array of regions with their IDs and names
   */
  async getAllRegions(): Promise<IRegion[]> {
    return this.knexService.knex('region').select('id', 'name');
  }

  /**
   * Retrieves a specific region by its ID
   * @param {string} regionId - The unique identifier of the region
   * @returns {Promise<IRegion | undefined>} Region data or undefined if not found
   */
  async getRegionById(regionId: string): Promise<IRegion | undefined> {
    return this.knexService.knex<IRegion>('region').where('id', regionId).first();
  }
}
