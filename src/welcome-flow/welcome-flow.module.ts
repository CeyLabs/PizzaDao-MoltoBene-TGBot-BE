import { Module } from '@nestjs/common';
import { WelcomeFlowService } from './welcome-flow.service';

@Module({
  providers: [WelcomeFlowService]
})
export class WelcomeFlowModule {}
