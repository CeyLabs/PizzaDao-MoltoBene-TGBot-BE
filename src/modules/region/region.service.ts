/**
 * @fileoverview Service for managing region-related operations
 * @module region.service
 */

import RunCache from 'run-cache';
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
    const cacheKey = 'regions:all';

    const cachedRegions = await RunCache.get(cacheKey);

    if (cachedRegions) {
      return JSON.parse(cachedRegions as string) as IRegion[];
    }

    const regions = await this.knexService.knex<IRegion>('region').select('id', 'name');

    await RunCache.set({ key: cacheKey, value: JSON.stringify(regions) });

    return regions;
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
