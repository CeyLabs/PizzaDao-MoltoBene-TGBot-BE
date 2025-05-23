/**
 * @fileoverview Service for managing event details
 * @module event-detail.service
 */

import { Injectable } from '@nestjs/common';
import { KnexService } from '../knex/knex.service';
import { IEventDetail } from './event-detail.interface';

/**
 * Service for managing event details
 * @class EventDetailService
 * @description Handles event detail operations, including retrieval of event information
 */
@Injectable()
export class EventDetailService {
  constructor(private readonly knexService: KnexService) {}

  /**
   * Retrieves event details by year and group ID
   * @param {number} year - The year of the event
   * @param {string | number} groupId - The Telegram group ID associated with the event
   * @returns {Promise<IEventDetail | null>} The event details or null if not found
   */
  async getEventByYearAndGroupId(
    year: number,
    groupId: string | number,
  ): Promise<IEventDetail | null> {
    const result = await this.knexService
      .knex<IEventDetail>('event_detail')
      .where('year', year)
      .where('group_id', groupId)
      .first();
    return result ?? null;
  }
}
