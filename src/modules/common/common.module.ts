import { Module } from '@nestjs/common';
import { WelcomeService } from '../welcome/welcome.service';
import { CommonController } from './common.controller';
import { CountryService } from '../country/country.service';
import { CityService } from '../city/city.service';
import { MembershipService } from '../membership/membership.service';

@Module({
  providers: [WelcomeService, CountryService, CityService, MembershipService],
  controllers: [CommonController],
})
export class CommonModule {}
