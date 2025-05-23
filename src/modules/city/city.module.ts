/**
 * @fileoverview City module for managing city-related functionality
 * @module city.module
 */

import { Module } from '@nestjs/common';
import { CityService } from './city.service';
import { KnexModule } from '../knex/knex.module';

/**
 * Module for managing city data and operations
 * @class CityModule
 * @description Handles city-related operations, including retrieving
 * cities by country and managing city data
 */
@Module({
  imports: [KnexModule],
  providers: [CityService],
  exports: [CityService],
})
export class CityModule {}
