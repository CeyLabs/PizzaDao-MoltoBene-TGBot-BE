import { Module } from '@nestjs/common';
import { CommonController } from './common.controller';
import { WelcomeModule } from '../welcome/welcome.module';
import { CountryModule } from '../country/country.module';
import { CityModule } from '../city/city.module';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [
    WelcomeModule,
    CountryModule,
    CityModule,
    MembershipModule,
  ],
  controllers: [CommonController],
})
export class CommonModule {}
