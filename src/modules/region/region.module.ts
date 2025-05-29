/**
 * @fileoverview Region module for managing region-related functionality
 * @module region.module
 */

import { Module } from '@nestjs/common';
import { KnexModule } from '../knex/knex.module';
import { RegionService } from './region.service';

/**
 * Module for managing country data and operations
 * @class RegionModule
 * @description Handles country-related operations, including retrieving
 * countries by region and managing country data
 */
@Module({
  imports: [KnexModule],
  providers: [RegionService],
  exports: [RegionService],
})
export class RegionModule {}
