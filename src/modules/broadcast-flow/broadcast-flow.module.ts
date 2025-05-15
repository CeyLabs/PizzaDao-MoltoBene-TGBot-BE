import { Module } from '@nestjs/common';
import { BroadcastFlowService } from './broadcast-flow.service';
import { CityService } from '../city/city.service';
import { UserService } from '../user/user.service';

@Module({
  providers: [BroadcastFlowService, CityService, UserService],
  exports: [BroadcastFlowService],
})
export class BroadcastFlowModule {}
