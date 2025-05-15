import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { KnexModule } from '../knex/knex.module';

@Module({
  imports: [KnexModule],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
