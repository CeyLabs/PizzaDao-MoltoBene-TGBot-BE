/**
 * @fileoverview Country module for managing country-related functionality
 * @module country.module
 */

import { Module } from '@nestjs/common';
import { CountryService } from './country.service';
import { KnexModule } from '../knex/knex.module';

/**
 * Module for managing country data and operations
 * @class CountryModule
 * @description Handles country-related operations, including retrieving
 * countries by region and managing country data
 */
@Module({
  imports: [KnexModule],
  providers: [CountryService],
  exports: [CountryService],
})
export class CountryModule {}
