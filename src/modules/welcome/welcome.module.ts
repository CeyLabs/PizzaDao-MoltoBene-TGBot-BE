import { Module } from '@nestjs/common';
import { WelcomeService } from './welcome.service';

@Module({
  providers: [WelcomeService],
})
export class WelcomeModule {}
