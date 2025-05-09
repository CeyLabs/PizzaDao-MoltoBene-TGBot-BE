import { Module } from '@nestjs/common';
import { BroadcastFlowService } from './broadcast-flow.service';
import { BroadcastFlowController } from './broadcast-flow.controller';
import { CityService } from '../city/city.service';

@Module({
  providers: [BroadcastFlowService, BroadcastFlowController, CityService],
  exports: [BroadcastFlowService],
})
export class BroadcastFlowModule {}
