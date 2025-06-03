/**
 * @fileoverview Module for managing event details
 * @module event-detail.module
 */

import { Module } from '@nestjs/common';
import { KnexModule } from '../knex/knex.module';
import { EventDetailService } from './event-detail.service';

/**
 * Module for managing event details
 * @class EventDetailModule
 * @description Handles event detail management, including retrieval and storage of event information
 */
@Module({
  imports: [KnexModule],
  providers: [EventDetailService],
  exports: [EventDetailService],
})
export class EventDetailModule {}
