import { Module } from '@nestjs/common';
import { WelcomeService } from './welcome.service';
import { UsersService } from '../users/users.service';

@Module({
  providers: [WelcomeService, UsersService],
})
export class WelcomeModule {}
