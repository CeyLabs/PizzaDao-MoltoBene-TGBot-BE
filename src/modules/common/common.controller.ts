import { On, Update } from 'nestjs-telegraf';
import { Controller } from '@nestjs/common';
import { Context } from 'telegraf';
import { WelcomeService } from '../welcome/welcome.service';

@Update()
@Controller()
export class CommonController {
  constructor(private readonly welcomeService: WelcomeService) {}

  @On('text')
  async handlePrivateChat(ctx: Context) {
    await this.welcomeService.handlePrivateChat(ctx);
  }
}
