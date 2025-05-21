import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { ICountry } from './country.interface';
import { ICity } from '../city/city.interface';

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

  async getCountryByGroupId(groupId: string): Promise<string | null> {
    const city = await this.knexService.knex<ICity>('city').where('group_id', groupId).first();
    if (!city) return null;
    const country = await this.knexService
      .knex<ICountry>('country')
      .where('id', city.country_id)
      .first();
    return country ? country.name : null;
  }
}
