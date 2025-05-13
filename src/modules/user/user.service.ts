import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { ICityUser, IUser } from './user.interface';

@Injectable()
export class UserService {
  constructor(private readonly knexService: KnexService) {}

  private registeredUsers = new Set<number>();

  async addUser(user: IUser): Promise<void> {
    await this.knexService.knex<IUser>('user').insert(user);
  }

  async isUserRegistered(telegramId: number): Promise<boolean> {
    const user: IUser | undefined = await this.knexService
      .knex<IUser>('user')
      .where({ telegram_id: telegramId })
      .first();
    return !!user;
  }

  getAllRegisteredUsers(): Set<number> {
    return this.registeredUsers;
  }

  async findUser(telegramId: number): Promise<IUser | undefined> {
    return this.knexService.knex<IUser>('user').where({ telegram_id: telegramId }).first();
  }

  async addCityParticipation(
    userId: number,
    cityId: string,
    countryId: string,
  ): Promise<ICityUser | undefined> {
    // Check if the user has already joined this city
    const existingParticipation = await this.knexService
      .knex<ICityUser>('city_user')
      .where('user_id', userId)
      .andWhere('city_id', cityId)
      .first();

    if (!existingParticipation) {
      console.log('User joined city:', userId, cityId, countryId);

      // Insert a new record if the user hasn't joined this city before
      await this.knexService.knex('city_user').insert({
        user_id: userId,
        city_id: cityId,
        country_id: countryId,
      });

      // Fetch and return the newly inserted record
      return this.knexService
        .knex<ICityUser>('city_user')
        .where('user_id', userId)
        .andWhere('city_id', cityId)
        .first();
    }

    return existingParticipation;
  }

  async getCitiesByUser(userId: number): Promise<{ city_id: number; city_name: string }[]> {
    return this.knexService
      .knex('city_user')
      .join('city', 'city_user.city_id', 'city.id')
      .select('city.id as city_id', 'city.name as city_name')
      .where('city_user.user_id', userId);
  }

  async isUserInCity(userId: string | number, cityId: string): Promise<boolean> {
    const participation = await this.knexService
      .knex<ICityUser>('city_user')
      .where('user_id', userId)
      .andWhere('city_id', cityId)
      .first();

    return !!participation;
  }

  async updateUserField(telegram_id: number, field: string, value: string): Promise<void> {
    await this.knexService
      .knex('user')
      .where({ telegram_id })
      .update({ [field]: value });
  }

  async getAllRegions(): Promise<{ id: string; name: string }[]> {
    return this.knexService.knex('region').select('id', 'name');
  }
}
