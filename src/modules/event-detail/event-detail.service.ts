import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { IEventDetail } from './event-detail.interface';

@Injectable()
export class EventDetailService {
  constructor(private readonly knexService: KnexService) {}

  async getEventByYear(year: number): Promise<IEventDetail | null> {
    const result = await this.knexService
      .knex<IEventDetail>('event_detail')
      .where('year', year)
      .first();
    return result ?? null;
  }
}
