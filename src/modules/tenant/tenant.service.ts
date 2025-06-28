/**
 * @fileoverview Service for managing tenants
 * @module tenant.service
 */

import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { ITenant } from './tenant.interface';

/**
 * Service for tenant related operations
 */
@Injectable()
export class TenantService {
  constructor(private readonly knexService: KnexService) {}

  /**
   * Creates a new tenant record
   * @param name - tenant display name
   * @param token - telegram bot token
   * @param username - optional bot username
   */
  async createTenant(name: string, token: string, username?: string): Promise<ITenant> {
    const [tenant] = await this.knexService.knex<ITenant>('tenant').insert(
      {
        name,
        token,
        username: username ?? null,
      },
      ['id', 'name', 'token', 'username'],
    );

    return tenant;
  }
}
