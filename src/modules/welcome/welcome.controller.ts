import { Controller } from '@nestjs/common';
import { Context } from 'telegraf';
import { WelcomeService } from './welcome.service';

@Controller()
export class WelcomeController {
  constructor(private readonly welcomeService: WelcomeService) {}

  async startCommand(ctx: Context): Promise<void> {
    await this.welcomeService.handleStartCommand(ctx);
  }

  async handleProfileCommand(ctx: Context): Promise<void> {
    await this.welcomeService.handleProfile(ctx);
  }

  async handleUserRegistration(ctx: Context): Promise<void> {
    await this.welcomeService.handleUserRegistration(ctx);
  }

  async handleNewMember(ctx: Context): Promise<void> {
    await this.welcomeService.handleNewMember(ctx);
  }

  async handleCallbackQuery(ctx: Context): Promise<void> {
    await this.welcomeService.handleCallbackQuery(ctx);
  }

  async handlePrivateChat(ctx: Context): Promise<void> {
    await this.welcomeService.handlePrivateChat(ctx);
  }

  async handleLeftChatMember(ctx: Context): Promise<void> {
    await this.welcomeService.handleLeftChatMember(ctx);
  }
}
