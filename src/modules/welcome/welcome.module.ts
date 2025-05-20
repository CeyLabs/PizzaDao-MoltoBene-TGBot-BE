import { forwardRef, Module } from '@nestjs/common';
import { WelcomeService } from './welcome.service';
import { CountryModule } from '../country/country.module';
import { CityModule } from '../city/city.module';
import { MembershipModule } from '../membership/membership.module';
import { UserModule } from '../user/user.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CountryModule,
    CityModule,
    MembershipModule,
    UserModule,
    forwardRef(() => CommonModule),
  ],
  providers: [WelcomeService],
  exports: [WelcomeService],
})
export class WelcomeModule {}
