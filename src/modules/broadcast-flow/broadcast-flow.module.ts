import { Module } from '@nestjs/common';
import { BroadcastFlowService } from './broadcast-flow.service';
import { BroadcastFlowController } from './broadcast-flow.controller';

@Module({
  providers: [BroadcastFlowService],
  controllers: [BroadcastFlowController],
  exports: [BroadcastFlowService],
})
export class BroadcastFlowModule {}
