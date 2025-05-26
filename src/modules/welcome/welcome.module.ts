/**
 * @fileoverview Welcome module for handling user onboarding and initial interactions
 * @module welcome.module
 */

import { forwardRef, Module } from '@nestjs/common';
import { WelcomeService } from './welcome.service';
import { CountryModule } from '../country/country.module';
import { CityModule } from '../city/city.module';
import { MembershipModule } from '../membership/membership.module';
import { UserModule } from '../user/user.module';
import { CommonModule } from '../common/common.module';
import { BroadcastModule } from '../broadcast/broadcast.module';

/**
 * Module that handles the welcome flow and user onboarding process
 * @class WelcomeModule
 * @description Manages user welcome interactions, including country/city selection,
 * membership setup, and initial user configuration
 */
@Module({
  imports: [
    CountryModule,
    CityModule,
    MembershipModule,
    UserModule,
    BroadcastModule,
    forwardRef(() => CommonModule),
  ],
  providers: [WelcomeService],
  exports: [WelcomeService],
})
export class WelcomeModule {}
