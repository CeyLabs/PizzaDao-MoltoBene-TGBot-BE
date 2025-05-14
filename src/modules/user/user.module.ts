import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { KnexModule } from '../knex/knex.module';

@Global()
@Module({
  imports: [KnexModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
