import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { ICityAccess, ICountryAccess, IRegionAccess } from './access.interface';

type CityData = {
  city_id: string;
  city_name: string;
  group_id: string | null;
  telegram_link: string | null;
};

type RegionData = {
  region_id: string;
  region_name: string;
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

type AdminAccessResult = {
  role: 'admin';
  city_data: CityData[];
  region_data: RegionData[];
  country_data: {
    country_id: string;
    country_name: string;
    city_data: CityData[];
  }[];
};

type regionAccess = {
  telegram_id: string;
  region_id: string;
};

type AccessResult =
  | RegionAccessResult[]
  | CountryAccessResult[]
  | HostAccessResult[]
  | AdminAccessResult[]
  | null;

type Role = 'admin' | 'underboss' | 'caporegime' | 'host' | null;

@Injectable()
export class AccessService {
  constructor(private readonly knexService: KnexService) {}

  async getAccessRole(telegram_id: string): Promise<Role> {
    const adminIds: string[] = process.env.ADMIN_IDS
      ? process.env.ADMIN_IDS.split(',').map((id) => id.trim())
      : [];

    if (adminIds.includes(telegram_id)) {
      return 'admin';
    }

    // Check region_access for underboss role
    const regionAccess = await this.knexService
      .knex<IRegionAccess>('region_access')
      .where('user_telegram_id', telegram_id)
      .first();

    if (regionAccess) {
      return 'underboss';
    }

    // Check country_access for caporegime role
    const countryAccess = await this.knexService
      .knex<ICountryAccess>('country_access')
      .where('user_telegram_id', telegram_id)
      .first();

    if (countryAccess) {
      return 'caporegime';
    }

    // Check user table for host role
    const cityAccess = await this.knexService
      .knex<ICityAccess>('city_access')
      .where('user_telegram_id', telegram_id)
      .first();

    if (cityAccess) {
      return 'host';
    }

    return null;
  }

  async getUserAccess(telegram_id: string): Promise<AccessResult> {
    const adminIds: string[] = process.env.ADMIN_IDS
      ? process.env.ADMIN_IDS.split(',').map((id) => id.trim())
      : [];

    if (adminIds.includes(telegram_id)) {
      const cities: CityData[] = await this.knexService
        .knex('city')
        .select('id as city_id', 'name as city_name', 'group_id', 'telegram_link');

      const regions: RegionData[] = await this.knexService
        .knex('region')
        .select('id as region_id', 'name as region_name');

      const country_data: { country_id: string; country_name: string; city_data: CityData[] }[] =
        [];
      for (const region of regions) {
        interface Country {
          country_id: string;
          country_name: string;
        }

        const countries: Country[] = await this.knexService
          .knex<Country>('country')
          .where('region_id', region.region_id)
          .select('id as country_id', 'name as country_name');

        for (const country of countries) {
          const citiesInCountry: CityData[] = await this.knexService
            .knex<CityData>('city')
            .where('country_id', country.country_id)
            .select('id as city_id', 'name as city_name', 'group_id', 'telegram_link');

          country_data.push({
            country_id: country.country_id,
            country_name: country.country_name,
            city_data: citiesInCountry,
          });
        }
      }

      return [
        {
          role: 'admin',
          city_data: cities,
          region_data: regions,
          country_data,
        },
      ];
    }

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
        return null;
      }

      interface Country {
        id: string;
        name: string;
      }

      const countries: Country[] = await this.knexService
        .knex<Country>('country')
        .where('region_id', region.id);

      const region_data: RegionData[] = [];

      for (const country of countries) {
        const cities: CityData[] = await this.knexService
          .knex('city')
          .where('country_id', country.id)
          .select('id as city_id', 'name as city_name', 'group_id', 'telegram_link');

        for (const city of cities) {
          region_data.push({
            region_id: region.id,
            region_name: region.name,
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

    //  Check country_access
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
        return null;
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

    //  Host role: only return cities user has access to from city_access table
    interface User {
      id: string;
      telegram_id: string;
    }

    const userExists: User | undefined = await this.knexService
      .knex<User>('user')
      .where('telegram_id', telegram_id)
      .first();

    if (userExists) {
      const accessibleCityIds = await this.knexService
        .knex('city_access')
        .where('user_telegram_id', telegram_id)
        .pluck('city_id');

      if (accessibleCityIds.length === 0) {
        return null;
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

    return null;
  }
}
