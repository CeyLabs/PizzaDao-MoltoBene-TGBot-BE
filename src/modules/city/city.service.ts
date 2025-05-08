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
}
