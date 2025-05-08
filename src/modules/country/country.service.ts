import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { ICountry } from './country.interface';

@Injectable()
export class CountryService {
  constructor(private readonly knexService: KnexService) {}

  async getCountriesByRegion(regionId: string): Promise<ICountry[]> {
    return this.knexService.knex('country').where({ region_id: regionId }).select('id', 'name');
  }

  async getCountryById(countryId: string): Promise<ICountry | null> {
    const country = await this.knexService
      .knex<ICountry>('country')
      .where('id', countryId)
      .select('id', 'name', 'region_id', 'created_at', 'updated_at')
      .first();
    return country ?? null;
  }
}
