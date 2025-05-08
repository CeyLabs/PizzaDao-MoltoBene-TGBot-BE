import { Module } from '@nestjs/common';
import { WelcomeService } from './welcome.service';
import { CountryService } from '../country/country.service';
import { CityService } from '../city/city.service';

@Module({
  providers: [WelcomeService, CountryService, CityService],
})
export class WelcomeModule {}
