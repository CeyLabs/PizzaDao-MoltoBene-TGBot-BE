import { Module } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Module({
    providers: [UsersService],
})
export class UsersModule {}
