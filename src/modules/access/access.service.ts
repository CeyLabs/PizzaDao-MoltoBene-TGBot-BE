import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { IAccess } from './access.interface';

type CityData = {
  city_id: string;
  city_name: string;
  group_id: string | null;
  telegram_link: string | null;
};

type RegionAccessResult = {
  region_id: string;
  region_name: string;
  role: 'underboss';
  city_data: CityData[];
};

type CountryAccessResult = {
  country_id: string;
  country_name: string;
  role: 'caporegime';
  city_data: CityData[];
};

type HostAccessResult = {
  role: 'host';
  city_data: CityData[];
};

type AccessResult = RegionAccessResult[] | CountryAccessResult[] | HostAccessResult[] | 'no access';

@Injectable()
export class AccessService {
  constructor(private readonly knexService: KnexService) {}

  // async getRoleByTelegramId(telegram_id: string): Promise<string | null> {
  //   const access: IAccess | undefined = await this.knexService
  //     .knex<IAccess>('access')
  //     .where({ user_telegram_id: telegram_id })
  //     .first();

  //   return access ? access.role : null;
  // }

  async getUserAccess(telegram_id: string): Promise<AccessResult> {
    // 1. Check region_access (role = underboss)
    const regionAccess = await this.knexService
      .knex('region_access')
      .where('user_telegram_id', telegram_id)
      .first();

    if (regionAccess) {
      const region = await this.knexService
        .knex('region')
        .where('id', regionAccess.region_id)
        .first();

      if (!region) {
        return 'no access';
      }

      const countries = await this.knexService.knex('country').where('region_id', region.id);

      const countryIds = countries.map((c) => c.id);

      const cities: CityData[] = await this.knexService
        .knex('city')
        .whereIn('country_id', countryIds)
        .select('id as city_id', 'name as city_name', 'group_id', 'telegram_link');

      return [
        {
          region_id: region.id,
          region_name: region.name,
          role: 'underboss',
          city_data: cities,
        },
      ];
    }

    // 2. Check country_access
    const countryAccess = await this.knexService
      .knex('country_access')
      .where('user_telegram_id', telegram_id)
      .first();

    if (countryAccess) {
      const country = await this.knexService
        .knex('country')
        .where('id', countryAccess.country_id)
        .first();

      if (!country) {
        return 'no access';
      }

      const cities: CityData[] = await this.knexService
        .knex('city')
        .where('country_id', country.id)
        .select('id as city_id', 'name as city_name', 'group_id', 'telegram_link');

      return [
        {
          country_id: country.id,
          country_name: country.name,
          role: 'caporegime',
          city_data: cities,
        },
      ];
    }

    // 3. Host role: only return cities user has access to from city_access table
    const userExists = await this.knexService
      .knex('user')
      .where('telegram_id', telegram_id)
      .first();

    if (userExists) {
      // Get cities user has access to
      const accessibleCityIds = await this.knexService
        .knex('city_access')
        .where('user_telegram_id', telegram_id)
        .pluck('city_id');

      if (accessibleCityIds.length === 0) {
        return 'no access';
      }

      const cities: CityData[] = await this.knexService
        .knex('city')
        .whereIn('id', accessibleCityIds)
        .select('id as city_id', 'name as city_name', 'group_id', 'telegram_link');

      return [
        {
          role: 'host',
          city_data: cities,
        },
      ];
    }

    return 'no access';
  }
}
