import { Module } from '@nestjs/common';
import { WelcomeService } from './welcome.service';
import { WelcomeController } from './welcome.controller';
import { CountryService } from '../country/country.service';
import { CityService } from '../city/city.service';

@Module({
  providers: [WelcomeService, WelcomeController, CountryService, CityService],
})
export class WelcomeModule {}
