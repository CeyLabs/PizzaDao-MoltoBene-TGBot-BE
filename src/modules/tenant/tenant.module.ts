import { Global, Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { KnexModule } from '../knex/knex.module';

@Global()
@Module({
  imports: [KnexModule],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
