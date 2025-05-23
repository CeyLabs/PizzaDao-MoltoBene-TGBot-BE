/**
 * @fileoverview User module for managing user-related functionality
 * @module user.module
 */

import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { KnexModule } from '../knex/knex.module';
import { UserController } from './user.controller';

/**
 * Global module for user management
 * @class UserModule
 * @description Provides user-related functionality across the application
 * @decorator @Global() - Makes this module available globally
 */
@Global()
@Module({
  imports: [KnexModule],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
