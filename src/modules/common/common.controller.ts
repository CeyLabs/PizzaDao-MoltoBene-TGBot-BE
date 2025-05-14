import { On, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { WelcomeService } from '../welcome/welcome.service';

@Update()
export class CommonController {
  constructor(private readonly welcomeService: WelcomeService) {}

  @On('text')
  async handlePrivateChat(ctx: Context) {
    await this.welcomeService.handlePrivateChat(ctx);
  }
}
