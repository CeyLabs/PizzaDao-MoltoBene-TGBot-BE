import { Module } from '@nestjs/common';
import { WelcomeModule } from '../welcome/welcome.module';
import { CountryModule } from '../country/country.module';
import { CityModule } from '../city/city.module';
import { MembershipModule } from '../membership/membership.module';
import { CommonService } from './common.service';
import { BroadcastModule } from '../broadcast/broadcast.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    WelcomeModule,
    CountryModule,
    CityModule,
    MembershipModule,
    BroadcastModule,
    UserModule,
  ],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
