/**
 * @fileoverview Tenant module providing tenant-related services
 * @module tenant.module
 */

import { Module } from '@nestjs/common';
import { KnexModule } from '../knex/knex.module';
import { TenantService } from './tenant.service';

/**
 * Module for tenant management
 * @class TenantModule
 */
@Module({
  imports: [KnexModule],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
