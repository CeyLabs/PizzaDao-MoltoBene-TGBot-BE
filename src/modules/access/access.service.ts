import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { IAccess } from './access.interface';

@Injectable()
export class AccessService {
  constructor(private readonly knexService: KnexService) {}

  async getRoleByTelegramId(telegram_id: string): Promise<string | null> {
    const access: IAccess | undefined = await this.knexService
      .knex<IAccess>('access')
      .where({ user_telegram_id: telegram_id })
      .first();

    return access ? access.role : null;
  }
}
