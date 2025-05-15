import { Module } from '@nestjs/common';
import { BroadcastFlowService } from './broadcast-flow.service';
import { UserModule } from '../user/user.module';
import { CityModule } from '../city/city.module';

@Module({
  imports: [CityModule, UserModule],
  providers: [BroadcastFlowService],
  exports: [BroadcastFlowService],
})
export class BroadcastFlowModule {}
