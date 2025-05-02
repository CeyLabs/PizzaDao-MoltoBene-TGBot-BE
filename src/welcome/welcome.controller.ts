import { Controller, Get } from '@nestjs/common';
import { WelcomeService } from './welcome.service';

@Controller()
export class WelcomeController {
  constructor(private readonly appService: WelcomeService) {}

  @Get()
  getHello(): string {
    return this.appService.getWelcome().message;
  }
}
