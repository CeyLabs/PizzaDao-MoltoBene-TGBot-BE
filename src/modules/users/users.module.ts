import { Global, Module } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Global()
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
