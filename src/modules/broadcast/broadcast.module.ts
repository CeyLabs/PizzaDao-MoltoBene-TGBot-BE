import { forwardRef, Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';
import { CityModule } from '../city/city.module';
import { BroadcastService } from './broadcast.service';
import { AccessModule } from '../access/access.module';
import { CommonModule } from '../common/common.module';
import { EventDetailModule } from '../event-detail/event-detail.module';

@Module({
  imports: [
    CityModule,
    UserModule,
    AccessModule,
    EventDetailModule,
    forwardRef(() => CommonModule),
  ],
  providers: [BroadcastService],
  exports: [BroadcastService],
})
export class BroadcastModule {}
