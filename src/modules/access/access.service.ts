import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';

type CityData = {
  city_id: string;
  city_name: string;
  group_id: string | null;
  telegram_link: string | null;
};

type RegionData = {
  country_id: string;
  country_name: string;
  city_id: string;
  city_name: string;
  group_id: string | null;
  telegram_link: string | null;
};

type RegionAccessResult = {
  region_id: string;
  region_name: string;
  role: 'underboss';
  region_data: RegionData[];
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

type regionAccess = {
  telegram_id: string;
  region_id: string;
};

type AccessResult = RegionAccessResult[] | CountryAccessResult[] | HostAccessResult[] | 'no access';

@Injectable()
export class AccessService {
  constructor(private readonly knexService: KnexService) {}

  async getUserAccess(telegram_id: string): Promise<AccessResult> {
    // 1. Check region_access (role = underboss)
    const regionAccess: regionAccess | undefined = await this.knexService
      .knex<regionAccess>('region_access')
      .where('user_telegram_id', telegram_id)
      .first();

    if (regionAccess) {
      interface Region {
        id: string;
        name: string;
      }

      const region: Region | undefined = await this.knexService
        .knex<Region>('region')
        .where('id', regionAccess.region_id)
        .first();

      if (!region) {
        return 'no access';
      }

      interface Country {
        id: string;
        name: string;
      }

      // Fetch all countries in the region
      const countries: Country[] = await this.knexService
        .knex<Country>('country')
        .where('region_id', region.id);

      // Loop through countries to get their cities and format the region data
      const region_data: RegionData[] = [];

      for (const country of countries) {
        const cities: CityData[] = await this.knexService
          .knex('city')
          .where('country_id', country.id)
          .select('id as city_id', 'name as city_name', 'group_id', 'telegram_link');

        for (const city of cities) {
          region_data.push({
            country_id: country.id,
            country_name: country.name,
            city_id: city.city_id,
            city_name: city.city_name,
            group_id: city.group_id,
            telegram_link: city.telegram_link,
          });
        }
      }

      return [
        {
          region_id: region.id,
          region_name: region.name,
          role: 'underboss',
          region_data,
        },
      ];
    }

    // 2. Check country_access
    interface CountryAccess {
      country_id: string;
    }

    const countryAccess: CountryAccess | undefined = await this.knexService
      .knex<CountryAccess>('country_access')
      .where('user_telegram_id', telegram_id)
      .first();

    if (countryAccess) {
      interface Country {
        id: string;
        name: string;
      }

      const country: Country | undefined = await this.knexService
        .knex<Country>('country')
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
    interface User {
      id: string;
      telegram_id: string;
    }

    const userExists: User | undefined = await this.knexService
      .knex<User>('user')
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
