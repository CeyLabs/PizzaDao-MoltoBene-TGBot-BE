import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { KnexModule } from '../knex/knex.module';
import { UserController } from './user.controller';

@Global()
@Module({
  imports: [KnexModule],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
