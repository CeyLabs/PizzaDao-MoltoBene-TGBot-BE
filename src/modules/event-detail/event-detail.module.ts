import { Module } from '@nestjs/common';
import { KnexModule } from '../knex/knex.module';
import { EventDetailService } from './event-detail.service';

@Module({
  imports: [KnexModule],
  providers: [EventDetailService],
  exports: [EventDetailService],
})
export class EventDetailModule {}
