import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Command, Start, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { WelcomeService } from './welcome/welcome.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getData().message;
  }
}
