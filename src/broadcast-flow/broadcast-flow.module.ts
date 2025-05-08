import { Module } from '@nestjs/common';
import { BroadcastFlowService } from './broadcast-flow.service';
import { BroadcastFlowUpdate } from './broadcast-flow.controller';

@Module({
  providers: [BroadcastFlowService, BroadcastFlowUpdate],
  exports: [BroadcastFlowService],
})
export class BroadcastFlowModule {}
