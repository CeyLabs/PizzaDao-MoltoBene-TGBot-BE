/**
 * @fileoverview Interfaces and types for the common module
 * @module common.interface
 */

/**
 * Type representing the possible user flows in the application
 * @typedef {('welcome' | 'broadcast' | 'idle')} TUserFlow
 * @description Defines the different states a user can be in during their interaction
 * with the bot: welcome flow, broadcast flow, or idle state
 */
export type TUserFlow = 'welcome' | 'broadcast' | 'idle';

/**
 * Interface representing a user's state in the application
 * @interface IUserState
 * @description Defines the structure of user state data, including the current flow,
 * associated messages, and any additional state information
 */
export interface IUserState {
  /** The current flow the user is in */
  flow: TUserFlow;
  /** Optional array of messages associated with the state */
  messages?: any[];
  /** Optional step identifier within the current flow */
  step?: string;
  /** Additional state properties */
  [key: string]: unknown;
}
