import { Module } from '@nestjs/common';
import { WelcomeService } from './welcome.service';
import { WelcomeController } from './welcome.controller';
import { CountryModule } from '../country/country.module';
import { CityModule } from '../city/city.module';
import { MembershipModule } from '../membership/membership.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    CountryModule,
    CityModule,
    MembershipModule,
    UserModule,
  ],
  controllers: [WelcomeController],
  providers: [WelcomeService],
  exports: [WelcomeService],
})
export class WelcomeModule {}
