/**
 * @fileoverview Broadcast module for managing message broadcasting functionality
 * @module broadcast.module
 */

import { forwardRef, Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';
import { CityModule } from '../city/city.module';
import { CountryModule } from '../country/country.module';
import { BroadcastService } from './broadcast.service';
import { AccessModule } from '../access/access.module';
import { CommonModule } from '../common/common.module';
import { EventDetailModule } from '../event-detail/event-detail.module';
import { RegionModule } from '../region/region.module';

/**
 * Module for managing message broadcasting functionality
 * @class BroadcastModule
 * @description Handles broadcasting messages to different channels and groups,
 * including message creation, media handling, and access control
 */
@Module({
  imports: [
    CityModule,
    CountryModule,
    RegionModule,
    UserModule,
    AccessModule,
    EventDetailModule,
    forwardRef(() => CommonModule),
  ],
  providers: [BroadcastService],
  exports: [BroadcastService],
})
export class BroadcastModule {}
