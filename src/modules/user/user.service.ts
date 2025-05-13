import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { IUser } from './user.interface';

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

  async getCitiesByUser(userId: number): Promise<{ city_id: number; city_name: string }[]> {
    return this.knexService
      .knex('membership')
      .join('city', 'membership.city_id', 'city.id')
      .select('city.id as city_id', 'city.name as city_name')
      .where('membership.user_id', userId);
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
