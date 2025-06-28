/**
 * @fileoverview Interfaces for the tenant module
 * @module tenant.interface
 */

/**
 * Interface representing a tenant in the system
 */
export interface ITenant {
  /** Unique identifier */
  id: string;
  /** Tenant name */
  name: string;
  /** Token for the tenant bot */
  token: string;
  /** Optional Telegram bot username */
  username?: string | null;
}
