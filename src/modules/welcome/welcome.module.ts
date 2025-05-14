import { Module } from '@nestjs/common';
import { WelcomeService } from './welcome.service';
import { WelcomeController } from './welcome.controller';
import { CountryService } from '../country/country.service';
import { CityService } from '../city/city.service';
import { MembershipService } from '../membership/membership.service';
import { CommonController } from '../common/common.controller';

@Module({
  providers: [
    WelcomeService,
    WelcomeController,
    CountryService,
    CityService,
    MembershipService,
    CommonController,
  ],
})
export class WelcomeModule {}
