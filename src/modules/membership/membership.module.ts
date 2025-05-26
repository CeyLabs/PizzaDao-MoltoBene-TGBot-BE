/**
 * @fileoverview Membership module for managing user-city memberships
 * @module membership.module
 */

import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { KnexModule } from '../knex/knex.module';

/**
 * Module for managing user memberships in cities
 * @class MembershipModule
 * @description Handles user membership operations, including joining cities
 * and managing membership data
 */
@Module({
  imports: [KnexModule],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
