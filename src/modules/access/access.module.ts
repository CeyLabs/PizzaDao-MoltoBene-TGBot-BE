import { Module } from '@nestjs/common';
import { KnexModule } from '../knex/knex.module';
import { AccessService } from './access.service';

@Module({
  imports: [KnexModule],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
