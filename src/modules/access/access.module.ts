/**
 * @fileoverview Module for managing access control
 * @module access.module
 */

import { Module } from '@nestjs/common';
import { KnexModule } from '../knex/knex.module';
import { AccessService } from './access.service';
import { RegionModule } from '../region/region.module';
import { CountryModule } from '../country/country.module';
import { CityModule } from '../city/city.module';

/**
 * Module for managing access control
 * @class AccessModule
 * @description Handles user access control at different levels (city, country, region)
 */
@Module({
  imports: [KnexModule, RegionModule, CountryModule, CityModule],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
