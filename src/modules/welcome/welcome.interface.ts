/**
 * @fileoverview Interfaces for the welcome module
 * @module welcome.interface
 */

import { IUser } from '../user/user.interface';

/**
 * Interface for user registration data
 * @interface IUserRegistrationData
 * @extends {IUser}
 * @description Extends the base user interface with additional fields
 * specific to the registration process
 */
export interface IUserRegistrationData extends IUser {
  /** Optional group ID where the user is registering from */
  group_id?: string | number | null;
  /** Optional region ID associated with the user's location */
  region_id?: string | null;
}
