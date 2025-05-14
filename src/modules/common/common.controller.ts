import { On, Update } from 'nestjs-telegraf';
import { Controller } from '@nestjs/common';
import { Context } from 'telegraf';
import { WelcomeService } from '../welcome/welcome.service';
import { CountryService } from '../country/country.service';
import { CityService } from '../city/city.service';
import { MembershipService } from '../membership/membership.service';

@Update()
@Controller()
export class CommonController {
  constructor(
    private readonly welcomeService: WelcomeService,
    private readonly countryService: CountryService,
    private readonly cityService: CityService,
    private readonly membershipService: MembershipService,
  ) {}

  @On('text')
  async handlePrivateChat(ctx: Context) {
    await this.welcomeService.handlePrivateChat(ctx);
  }
}
