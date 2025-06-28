/**
 * @fileoverview Tenant module definition
 * @module tenant.module
 */

import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { KnexModule } from '../knex/knex.module';

@Module({
  imports: [KnexModule],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
