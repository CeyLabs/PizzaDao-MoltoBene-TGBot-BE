import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';

@Injectable()
export class CityService {
  constructor(private readonly knexService: KnexService) {}

  async getCitiesByCountry(
    countryId: string,
  ): Promise<{ id: string; name: string }[]> {
    return this.knexService
      .knex('city')
      .where({ country_id: countryId })
      .select('id', 'name');
  }

  async getCityById(
    cityId: string,
  ): Promise<{ id: string; name: string } | null> {
    const city = await this.knexService
      .knex<{ id: string; name: string }>('city')
      .where({ id: cityId })
      .first();
    return city || null;
  }

  async updateCityAdmins(cityId: string, adminIds: string[]): Promise<void> {
    // Validate that all adminIds belong to users with the role 'admin'
    const validAdminIds = await this.knexService
      .knex('user')
      .whereIn('id', adminIds)
      .andWhere({ role: 'admin' })
      .pluck('id');

    // Update the city with the validated admin IDs
    await this.knexService
      .knex('city')
      .where({ id: cityId })
      .update({ admin_ids: validAdminIds });
  }
}
