import { Global, Module } from '@nestjs/common';
import { CityService } from './city.service';

@Global()
@Module({
  providers: [CityService],
})
export class CityModule {}
