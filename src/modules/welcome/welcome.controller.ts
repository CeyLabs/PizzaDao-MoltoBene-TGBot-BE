import { On, Command, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { WelcomeService } from './welcome.service';

@Update()
export class WelcomeController {
  constructor(private readonly welcomeService: WelcomeService) {}

  @Start()
  async startCommand(ctx: Context) {
    await this.welcomeService.handleStartCommand(ctx);
  }

  @Command('profile')
  async handleProfileCommand(ctx: Context) {
    await this.welcomeService.handleProfile(ctx);
  }

  @Command('register')
  async handleUserRegistration(ctx: Context) {
    await this.welcomeService.handleUserRegistration(ctx);
  }

  @On('new_chat_members')
  async handleNewMember(ctx: Context) {
    await this.welcomeService.handleNewMember(ctx);
  }

  @On('callback_query')
  async handleCallbackQuery(ctx: Context) {
    await this.welcomeService.handleCallbackQuery(ctx);
  }

  @On('left_chat_member')
  async handleLeftChatMember(ctx: Context) {
    await this.welcomeService.handleLeftChatMember(ctx);
  }
}
