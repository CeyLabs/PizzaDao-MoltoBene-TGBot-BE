import { Module } from '@nestjs/common';
import { WelcomeModule } from '../welcome/welcome.module';
import { CountryModule } from '../country/country.module';
import { CityModule } from '../city/city.module';
import { MembershipModule } from '../membership/membership.module';
import { CommonService } from './common.service';

@Module({
  imports: [WelcomeModule, CountryModule, CityModule, MembershipModule],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
