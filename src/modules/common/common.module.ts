import { Module } from '@nestjs/common';
import { WelcomeService } from '../welcome/welcome.service';
import { CommonController } from './common.controller';
import { CountryService } from '../country/country.service';
import { CityService } from '../city/city.service';
import { MembershipService } from '../membership/membership.service';

@Module({
  providers: [WelcomeService, CommonController, CountryService, CityService, MembershipService],
})
export class CommonModule {}
