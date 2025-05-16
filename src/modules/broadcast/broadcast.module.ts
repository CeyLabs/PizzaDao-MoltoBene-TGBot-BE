import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';
import { CityModule } from '../city/city.module';
import { BroadcastService } from './broadcast.service';

@Module({
  imports: [CityModule, UserModule],
  providers: [BroadcastService],
  exports: [BroadcastService],
})
export class BroadcastModule {}
