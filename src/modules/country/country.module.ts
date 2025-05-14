import { Module } from '@nestjs/common';
import { CountryService } from './country.service';
import { KnexModule } from '../knex/knex.module';

@Module({
  imports: [KnexModule],
  providers: [CountryService],
  exports: [CountryService],
})
export class CountryModule {}
