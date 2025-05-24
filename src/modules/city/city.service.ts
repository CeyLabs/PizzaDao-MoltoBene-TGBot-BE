import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { ICity } from './city.interface';

@Injectable()
export class CityService {
  constructor(private readonly knexService: KnexService) {}

  async getAllCities(): Promise<ICity[]> {
    return this.knexService.knex('city').select('id', 'name', 'group_id', 'country_id');
  }

  async getCitiesByCountry(countryId: string): Promise<ICity[]> {
    return this.knexService
      .knex('city')
      .where({ country_id: countryId })
      .select('id', 'name', 'telegram_link');
  }

  async getCityById(cityId: string): Promise<ICity | null> {
    const city = await this.knexService
      .knex<ICity>('city')
      .where('id', cityId)
      .select('id', 'name', 'country_id')
      .first();
    return city || null;
  }

  // async updateCityAdmins(cityId: string, adminIds: string[]): Promise<void> {
  //   // Validate that all adminIds belong to users with the role 'admin'
  //   const validAdminIds = await this.knexService
  //     .knex('user')
  //     .whereIn('id', adminIds)
  //     .andWhere({ role: 'admin' })
  //     .pluck('id');

  //   // Update the city with the validated admin IDs
  //   await this.knexService.knex('city').where({ id: cityId }).update({ admin_ids: validAdminIds });
  // }

  async getCityByGroupId(groupId: string | number): Promise<ICity | null> {
    const city = (await this.knexService
      .knex('city')
      .where('group_id', groupId)
      .select('id', 'name', 'country_id')
      .first()) as ICity | undefined;
    return city || null;
  }
}
