/**
 * @fileoverview Service for managing tenant operations
 * @module tenant.service
 */

import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { ITenant } from './tenant.interface';

/**
 * Service for retrieving active tenants from the database
 * @class TenantService
 */
@Injectable()
export class TenantService {
  constructor(private readonly knexService: KnexService) {}

  /**
   * Retrieves all active tenants
   * @returns {Promise<ITenant[]>} Array of active tenants
   */
  async getActiveTenants(): Promise<ITenant[]> {
    return this.knexService
      .knex<ITenant>('tenant')
      .select('*')
      .where('is_active', true);
  }
}
