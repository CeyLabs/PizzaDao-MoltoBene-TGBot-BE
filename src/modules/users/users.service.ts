import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';

@Injectable()
export class UsersService {
  constructor(private readonly knexService: KnexService) {}

  private registeredUsers = new Set<number>();

  async addUser(telegramId: number, first_name: string): Promise<void> {
    await this.knexService.knex('users').insert({
      telegram_id: telegramId,
      first_name,
    });
  }

  async isUserRegistered(telegramId: number): Promise<boolean> {
    const user = await this.knexService
      .knex('users')
      .where({ telegram_id: telegramId })
      .first();
    return !!user;
  }

  getAllRegisteredUsers(): Set<number> {
    return this.registeredUsers;
  }

  async findUser(telegramId: number) {
    return this.knexService
      .knex('users')
      .where({ telegram_id: telegramId })
      .first();
  }
}
