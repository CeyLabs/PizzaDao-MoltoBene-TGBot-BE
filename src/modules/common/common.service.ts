import { Injectable } from '@nestjs/common';
import { On, Update } from 'nestjs-telegraf';
import { WelcomeService } from '../welcome/welcome.service';
import { Context } from 'telegraf';

@Update()
@Injectable()
export class CommonService {
  constructor(private readonly welcomeService: WelcomeService) {}

  @On('text')
  async handlePrivateChat(ctx: Context) {
    await this.welcomeService.handlePrivateChat(ctx);
  }
}
