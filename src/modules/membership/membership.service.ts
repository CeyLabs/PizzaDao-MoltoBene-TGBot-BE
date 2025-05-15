import { Injectable } from '@nestjs/common';
import { IMembership } from './membership.interface';
import { KnexService } from '../knex/knex.service';

@Injectable()
export class MembershipService {
  constructor(private readonly knexService: KnexService) {}

  async getCitiesByUser(userId: string): Promise<{ city_id: number; city_name: string }[]> {
    return this.knexService
      .knex('membership')
      .join('city', 'membership.city_id', 'city.id')
      .select('city.id as city_id', 'city.name as city_name')
      .where('membership.user_telegram_id', userId);
  }

  async checkUserCityMembership(userId: string, cityId: string): Promise<boolean> {
    const participation = await this.knexService
      .knex<IMembership>('membership')
      .where('user_telegram_id', userId)
      .andWhere('city_id', cityId)
      .first();

    return !!participation;
  }

  async addUserToCityMembership(
    userId: string | null,
    cityId: string,
  ): Promise<IMembership | undefined> {
    // Check if the user has already joined this city
    const existingParticipation = await this.knexService
      .knex<IMembership>('membership')
      .where('user_telegram_id', userId)
      .andWhere('city_id', cityId)
      .first();

    if (!existingParticipation) {
      // Insert a new record if the user hasn't joined this city before
      await this.knexService.knex('membership').insert({
        user_telegram_id: userId,
        city_id: cityId,
      });

      // Fetch and return the newly inserted record
      return this.knexService
        .knex<IMembership>('membership')
        .where('user_telegram_id', userId)
        .andWhere('city_id', cityId)
        .first();
    }

    return existingParticipation;
  }
}
