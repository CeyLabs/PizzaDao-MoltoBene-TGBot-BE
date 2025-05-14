import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';

@Module({
  providers: [MembershipService],
})
export class MembershipModule {}
