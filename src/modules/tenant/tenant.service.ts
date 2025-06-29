import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { ITenant } from './tenant.interface';

@Injectable()
export class TenantService {
  constructor(private readonly knexService: KnexService) {}

  async getActiveTenants(): Promise<ITenant[]> {
    return this.knexService.knex<ITenant>('tenant').where({ is_active: true }).select('*');
  }

  async createTenant(tenant: Omit<ITenant, 'id' | 'created_at' | 'updated_at'>): Promise<ITenant> {
    const [created] = await this.knexService.knex<ITenant>('tenant').insert(tenant).returning('*');
    return created;
  }
}
