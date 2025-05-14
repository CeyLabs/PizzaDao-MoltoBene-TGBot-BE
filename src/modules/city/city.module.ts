import { Module } from '@nestjs/common';
import { CityService } from './city.service';
import { KnexModule } from '../knex/knex.module';

@Module({
  imports: [KnexModule],
  providers: [CityService],
  exports: [CityService],
})
export class CityModule {}
