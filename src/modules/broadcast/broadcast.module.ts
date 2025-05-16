import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';
import { CityModule } from '../city/city.module';
import { BroadcastService } from './broadcast.service';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [CityModule, UserModule, AccessModule],
  providers: [BroadcastService],
  exports: [BroadcastService],
})
export class BroadcastModule {}
