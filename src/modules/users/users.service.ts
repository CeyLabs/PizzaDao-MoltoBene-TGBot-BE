import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';

@Injectable()
export class UsersService {
  constructor(private readonly knexService: KnexService) {}

  private registeredUsers = new Set<number>();

  async addUser(
    telegram_id: number,
    username: string | null,
    tg_first_name: string | null,
    tg_last_name: string | null,
    custom_full_name: string | null,
    country: string | null,
    city: string | null,
    role: string,
    mafia_movie: string | null,
    ninja_turtle_character: string | null,
    pizza_topping: string | null,
  ): Promise<void> {
    await this.knexService.knex('user').insert({
      telegram_id,
      username,
      tg_first_name,
      tg_last_name,
      custom_full_name,
      country,
      city,
      role,
      mafia_movie,
      ninja_turtle_character,
      pizza_topping,
    });
  }

  async isUserRegistered(telegramId: number): Promise<boolean> {
    const user = await this.knexService
      .knex('user')
      .where({ telegram_id: telegramId })
      .first();
    return !!user;
  }

  getAllRegisteredUsers(): Set<number> {
    return this.registeredUsers;
  }

  async findUser(telegramId: number) {
    return this.knexService
      .knex('user')
      .where({ telegram_id: telegramId })
      .first();
  }

  async updateUserField(
    telegram_id: number,
    field: string,
    value: string,
  ): Promise<void> {
    await this.knexService
      .knex('user')
      .where({ telegram_id })
      .update({ [field]: value });
  }
}
