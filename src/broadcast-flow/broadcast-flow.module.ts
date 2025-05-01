import { Module } from '@nestjs/common';
import { BroadcastFlowService } from './broadcast-flow.service';
import { BroadcastFlowUpdate } from './broadcast-flow.update';

@Module({
  providers: [BroadcastFlowService, BroadcastFlowUpdate],
  exports: [BroadcastFlowService],
})
export class BroadcastFlowModule {}
