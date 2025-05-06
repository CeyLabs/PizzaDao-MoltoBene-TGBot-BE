import { Module } from '@nestjs/common';
import { GeneralService } from './general.service';
import { UsersService } from '../users/users.service';

@Module({
  providers: [GeneralService, UsersService],
})
export class GeneralModule {}
