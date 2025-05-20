import { Module } from '@nestjs/common';
import { WelcomeService } from './welcome.service';
import { CountryModule } from '../country/country.module';
import { CityModule } from '../city/city.module';
import { MembershipModule } from '../membership/membership.module';
import { UserModule } from '../user/user.module';
import { TelegramLoggerService } from 'src/utils/telegram-logger.service';

@Module({
  imports: [CountryModule, CityModule, MembershipModule, UserModule],
  providers: [WelcomeService, TelegramLoggerService],
  exports: [WelcomeService],
})
export class WelcomeModule {}
