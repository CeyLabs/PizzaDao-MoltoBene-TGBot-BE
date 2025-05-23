/**
 * @fileoverview Module for managing access control
 * @module access.module
 */

import { Module } from '@nestjs/common';
import { KnexModule } from '../knex/knex.module';
import { AccessService } from './access.service';

/**
 * Module for managing access control
 * @class AccessModule
 * @description Handles user access control at different levels (city, country, region)
 */
@Module({
  imports: [KnexModule],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
