import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';

interface User {
  telegram_id: number;
  username: string | null;
  tg_first_name: string | null;
  tg_last_name: string | null;
  custom_full_name: string | null;
  country_id: string | null;
  city_id: string | null;
  role: string;
  mafia_movie: string | null;
  ninja_turtle_character: string | null;
  pizza_topping: string | null;
}

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
    country_id: string | null,
    city_id: string | null,
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
      country_id,
      city_id,
      role,
      mafia_movie,
      ninja_turtle_character,
      pizza_topping,
    });

    await this.knexService.knex<User>('user').where({ telegram_id }).first();
  }

  async isUserRegistered(telegramId: number): Promise<boolean> {
    const user: User | undefined = await this.knexService
      .knex<User>('user')
      .where({ telegram_id: telegramId })
      .first();
    return !!user;
  }

  getAllRegisteredUsers(): Set<number> {
    return this.registeredUsers;
  }

  async findUser(telegramId: number): Promise<User | undefined> {
    return this.knexService
      .knex<User>('user')
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

  async getAllRegions(): Promise<{ id: string; name: string }[]> {
    return this.knexService.knex('region').select('id', 'name');
  }
}
