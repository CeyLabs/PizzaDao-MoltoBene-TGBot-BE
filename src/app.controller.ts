import { Help, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { AppService } from './app.service';
import { Controller } from '@nestjs/common';

@Update()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Help()
  async helpCommand(ctx: Context) {
    await this.appService.handleHelpCommand(ctx);
  }
}
