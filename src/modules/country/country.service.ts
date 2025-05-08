import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';

@Injectable()
export class CountryService {
  constructor(private readonly knexService: KnexService) {}

  async getCountriesByRegion(
    regionId: string,
  ): Promise<{ id: string; name: string }[]> {
    return this.knexService
      .knex('country')
      .where({ region_id: regionId })
      .select('id', 'name');
  }

  async getCountryById(
    countryId: string,
  ): Promise<{ id: string; name: string } | null> {
    const country = await this.knexService
      .knex<{ id: string; name: string }>('country')
      .where({ id: countryId })
      .first();
    return country ?? null;
  }
}
