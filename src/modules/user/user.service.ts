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

  async getAllUsers(): Promise<any[]> {
    return this.knexService.knex('user').select('*');
  }

  async isUserRegistered(userId: string | null): Promise<boolean> {
    if (!userId) {
      return false;
    }

    const user: IUser | undefined = await this.knexService
      .knex<IUser>('user')
      .where({ telegram_id: userId })
      .first();
    return !!user;
  }

  getAllRegisteredUsers(): Set<number> {
    return this.registeredUsers;
  }

  async findUser(userId: string): Promise<IUser | undefined> {
    return this.knexService.knex<IUser>('user').where({ telegram_id: userId }).first();
  }

  async updateUserField(telegram_id: string, field: string, value: string): Promise<void> {
    await this.knexService
      .knex('user')
      .where({ telegram_id })
      .update({ [field]: value });
  }

  async getAllRegions(): Promise<{ id: string; name: string }[]> {
    return this.knexService.knex('region').select('id', 'name');
  }

  async isPizzaNameExists(pizzaName: string): Promise<boolean> {
    const existingPizzaName: IUser | undefined = await this.knexService
      .knex<IUser>('user')
      .where('pizza_name', pizzaName)
      .first();

    return !!existingPizzaName;
  }
}
